import { NextResponse } from "next/server";
import { loadMarketsBundle } from "@/lib/coingecko";

export async function GET() {
  try {
    const data = await loadMarketsBundle({ next: { revalidate: 3600 } });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to load markets" },
      { status: 502 },
    );
  }
}
