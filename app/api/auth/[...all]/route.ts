import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

const handlers = toNextJsHandler(auth);

const baseURL = "https://it-lagersystem.deutsche-windtechnik.com/scannerpage";

function rewriteRequest(req: NextRequest) {
  const { search, pathname } = req.nextUrl;
  const url = new URL(`${baseURL}${pathname}`);
  url.search = search;

  return new NextRequest(url, req);
}

export async function GET(req: NextRequest) {
  const modified = rewriteRequest(req);
  return handlers.GET(modified);
}

export async function POST(req: NextRequest) {
  const modified = rewriteRequest(req);
  return handlers.POST(modified);
}
