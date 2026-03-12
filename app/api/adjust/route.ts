import { NextResponse } from "next/server";

// Route removed — keep a minimal stub to return 404 so accidental calls fail safely.
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Route removed. Use the server action `adjustStockAction` instead.",
    },
    { status: 404 },
  );
}
