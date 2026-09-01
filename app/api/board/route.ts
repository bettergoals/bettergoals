import { NextResponse } from "next/server";
import { fetchBoard } from "@/lib/github";

export async function GET() {
  const board = await fetchBoard();
  return NextResponse.json(board, {
    headers: { "Cache-Control": "s-maxage=15, stale-while-revalidate=60" },
  });
}
