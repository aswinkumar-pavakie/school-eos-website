// Authenticated proxy for AddTeamPanel's age-group/category picker -- see
// /api/sports-admin/teams/route.ts's own header comment for why this exists.

import { NextRequest, NextResponse } from "next/server";
import { listSportCategories } from "@/lib/sports-admin-api";

export async function GET(request: NextRequest) {
  const sportId = new URL(request.url).searchParams.get("sportId");
  if (!sportId) return NextResponse.json({ data: [] });
  try {
    const categories = await listSportCategories(sportId);
    return NextResponse.json({ data: categories });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
