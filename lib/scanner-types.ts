export function cleanBarcode(raw: string) {
  return raw
    .trim()
    .replace(/◙/g, "")
    .replace(/ß/g, "-")
    .replace(/\?/g, "-")
    .replace(/[^A-Za-z0-9\-]/g, "")
    .toUpperCase();
}

export type Phase = "idle" | "scanning" | "ready" | "booking";

export type HistoryItem = {
  ts: number; // Date.now()
  partName: string;
  barcode: string;
  delta: number;
  from: number;
  to: number;
};

export const PEOPLE = [
  "Maxim",
  "Leve",
  "Jorge",
  "Nico",
  "Philipp",
  "Bjarne",
  "Felix",
  "Jonas",
  "Jörg",
  "Lars",
  "Lisa",
  "Michael",
] as const;
export type Person = (typeof PEOPLE)[number];
