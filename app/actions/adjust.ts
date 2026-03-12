"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import { logger } from "@/lib/logger";
import "@/lib/env-validation"; // Validate environment on import
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface InvenTreePart {
  pk: number;
  name: string;
  IPN?: string;
  ipn?: string;
}

function cleanBarcode(raw: string) {
  return raw
    .trim()
    .replace(/◙/g, "")
    .replace(/ß/g, "-")
    .replace(/\?/g, "-")
    .replace(/[^A-Za-z0-9\-]/g, "")
    .toUpperCase();
}
const BarcodeSchema = z
  .string()
  .min(1, "Barcode darf nicht leer sein")
  .max(100, "Barcode zu lang")
  .transform(cleanBarcode)
  .refine((v) => v.length >= 3, "Barcode muss mindestens 3 Zeichen haben")
  .refine((v) => v.length <= 50, "Barcode zu lang")
  .refine((v) => /^[A-Z0-9\-]+$/.test(v), "Barcode enthält ungültige Zeichen");

const AdjustSchema = z.object({
  barcode: BarcodeSchema,
  delta: z.coerce
    .number()
    .int("Menge muss eine ganze Zahl sein")
    .min(-10000, "Menge zu klein")
    .max(10000, "Menge zu groß")
    .refine((v) => v !== 0, "Menge darf nicht 0 sein"),
  operator: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(50, "Name zu lang")
    .regex(/^[\p{L}\p{M}\s-]+$/u, "Name enthält ungültige Zeichen")
    .transform((v) => v.trim()),
});

async function inventreeFetch(path: string, init?: RequestInit) {
  const base = process.env.INVENTREE_URL;
  const token = process.env.INVENTREE_TOKEN;

  if (!base || !token) {
    throw new Error("Server ENV fehlt (INVENTREE_URL/INVENTREE_TOKEN).");
  }

  const url = `${base}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const method = init?.method ?? "GET";
    throw new Error(
      `InvenTree ${method} ${path} fehlgeschlagen (${res.status} ${res.statusText}): ${errText}`,
    );
  }

  return res;
}

export const adjustStockAction = actionClient
  .inputSchema(AdjustSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      throw new Error("Unauthorized");
    }

    const startTime = Date.now();
    const { barcode, delta, operator } = parsedInput;

    logger.info("Stock adjustment started", {
      barcode,
      delta,
      operator,
      category: "business",
    });

    try {
      // 1) Part via IPN search
      const partRes = await inventreeFetch(
        `/api/part/?search=${encodeURIComponent(barcode)}`,
      );
      const partJson = await partRes.json();
      const parts = Array.isArray(partJson)
        ? partJson
        : (partJson?.results ?? []);
      const exactPart = parts.find(
        (p: InvenTreePart) =>
          String(p.IPN || p.ipn || "").toUpperCase() === barcode,
      );

      if (!exactPart)
        throw new Error("Kein Part mit exakt dieser IPN gefunden.");

      const partId = exactPart.pk;
      const partName = exactPart.name ?? "Unbekannter Part";

      // 2) Stock holen
      const stockRes = await inventreeFetch(`/api/stock/?part=${partId}`);
      const stockJson = await stockRes.json();
      const stock = Array.isArray(stockJson)
        ? stockJson
        : (stockJson?.results ?? []);

      if (!stock?.length) {
        throw new Error(
          `Kein Lagerbestand für diesen Part vorhanden. Part: ${partName}`,
        );
      }

      const stockItem = stock[0];
      const stockId = stockItem.pk;
      const currentQty = Number(stockItem.quantity ?? 0);
      const newQty = currentQty + delta;

      if (newQty < 0) {
        throw new Error(`Abbruch – Bestand wäre negativ (${newQty}).`);
      }

      // 3) PATCH
      const absQty = Math.abs(delta);
      const notes = `Scanner | User: ${operator} | IPN: ${barcode} | Anzahl: ${delta}`;

      if (delta > 0) {
        await inventreeFetch(`/api/stock/add/`, {
          method: "POST",
          body: JSON.stringify({
            items: [{ pk: stockId, quantity: String(absQty) }],
            notes,
          }),
        });
      } else {
        await inventreeFetch(`/api/stock/remove/`, {
          method: "POST",
          body: JSON.stringify({
            items: [{ pk: stockId, quantity: String(absQty) }],
            notes,
          }),
        });
      }

      const duration = Date.now() - startTime;
      logger.info("Stock adjustment completed successfully", {
        barcode,
        delta,
        operator,
        partName,
        currentQty,
        newQty,
        duration,
        category: "business",
      });

      return { partName, currentQty, newQty, barcode };
    } catch (error) {
      logger.error("Stock adjustment failed", error, {
        barcode,
        delta,
        operator,
        category: "business",
      });
      throw error; // Re-throw to let safe-action handle it
    }
  });
