import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import "@/lib/env-validation"; // Validate environment on import

interface InvenTreePart {
  pk: number;
  name: string;
  IPN?: string;
  ipn?: string;
}

const BarcodeSchema = z
  .string()
  .min(1, "Barcode darf nicht leer sein")
  .max(100, "Barcode zu lang")
  .transform(cleanBarcode)
  .refine((v) => v.length >= 3, "Barcode muss mindestens 3 Zeichen haben")
  .refine((v) => v.length <= 50, "Barcode zu lang")
  .refine((v) => /^[A-Z0-9\-]+$/.test(v), "Barcode enthält ungültige Zeichen");

function cleanBarcode(raw: string) {
  return raw
    .trim()
    .replace(/◙/g, "")
    .replace(/ß/g, "-")
    .replace(/\?/g, "-")
    .replace(/[^A-Za-z0-9\-]/g, "")
    .toUpperCase();
}

async function inventreeFetch(path: string, init?: RequestInit) {
  const base = process.env.INVENTREE_URL;
  const token = process.env.INVENTREE_TOKEN;

  if (!base || !token)
    throw new Error("Server ENV fehlt (INVENTREE_URL/INVENTREE_TOKEN).");

  const url = new URL(path, base).toString();
  console.log(url);
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  return res;
}

export async function GET(req: Request) {
  const startTime = Date.now();
  const url = new URL(req.url);

  // Apply rate limiting
  const rateLimitResponse = rateLimitMiddleware(req as any);
  if (rateLimitResponse) {
    logger.security("Rate limit exceeded", {
      path: url.pathname,
      ip: (req as any).ip,
    });
    return rateLimitResponse;
  }

  try {
    // Verify user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBarcode = url.searchParams.get("barcode") || "";
    const parsed = BarcodeSchema.safeParse(rawBarcode);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Kein gültiger Barcode." },
        { status: 400 },
      );
    }
    const barcode = parsed.data;

    // 1) Part via IPN search
    const partRes = await inventreeFetch(
      `/api/part/?search=${encodeURIComponent(barcode)}`,
    );
    console.log(partRes);
    if (!partRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch part data" },
        { status: 500 },
      );
    }

    const partJson = await partRes.json();
    const parts = Array.isArray(partJson)
      ? partJson
      : (partJson?.results ?? []);
    const exactPart = parts.find(
      (p: InvenTreePart) =>
        String(p.IPN || p.ipn || "").toUpperCase() === barcode,
    );

    if (!exactPart) {
      return NextResponse.json(
        { error: "Kein Part mit exakt dieser IPN gefunden." },
        { status: 404 },
      );
    }

    const partId = exactPart.pk;
    const partName = exactPart.name || "Unbekannter Part";

    // 2) Stock holen
    const stockRes = await inventreeFetch(`/api/stock/?part=${partId}`);
    if (!stockRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch stock data" },
        { status: 500 },
      );
    }
    const stockJson = await stockRes.json();
    const stock = Array.isArray(stockJson)
      ? stockJson
      : (stockJson?.results ?? []);

    if (!stock?.length) {
      return NextResponse.json(
        {
          error: `Kein Lagerbestand für diesen Part vorhanden. Part: ${partName}`,
        },
        { status: 404 },
      );
    }

    const stockItem = stock[0];
    const currentQty = Number(stockItem.quantity ?? 0);

    const duration = Date.now() - startTime;
    logger.api("GET", url.pathname, 200, duration, session?.user?.id);

    return NextResponse.json({ partName, currentQty });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Unbekannter Fehler";
    logger.error("Part preview API error", e, {
      path: url.pathname,
      barcode: url.searchParams.get("barcode"),
    });
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
