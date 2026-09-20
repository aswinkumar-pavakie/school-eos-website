// Authenticated proxy for Sports Admin's client-side sport pickers -- see
// /api/sports-admin/teams/route.ts's own header comment for why this exists.

import { NextResponse } from "next/server";
import { listSports } from "@/lib/sports-admin-api";

export async function GET() {
  try {
    const sports = await listSports();
    return NextResponse.json({ data: sports });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
