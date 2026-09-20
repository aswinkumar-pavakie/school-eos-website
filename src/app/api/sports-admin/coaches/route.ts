// Authenticated proxy for Sports Admin's client-side coach pickers -- see
// /api/sports-admin/teams/route.ts's own header comment for why this exists.

import { NextResponse } from "next/server";
import { listCoaches } from "@/lib/sports-admin-api";

export async function GET() {
  try {
    const coaches = await listCoaches();
    return NextResponse.json({ data: coaches });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
