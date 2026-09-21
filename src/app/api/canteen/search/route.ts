// Backs the canteen Ledger screen's student picker -- the manual stand-in
// for an NFC card tap (see canteen-api.ts's own header comment). A thin
// same-origin proxy so the client component can call it with a plain fetch,
// the same pattern /api/global-search and /api/ai-chat already use, since
// the real backend call (searchCanteenStudents -> apiFetch) needs the
// httpOnly auth cookie and can only run server-side.

import { NextRequest, NextResponse } from "next/server";
import { searchCanteenStudents } from "@/lib/canteen-api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";
  try {
    const data = await searchCanteenStudents(query);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Search failed." },
      { status: 500 },
    );
  }
}
