// Authenticated proxy for AddCoachPanel's in-house staff picker -- see
// /api/sports-admin/teams/route.ts's own header comment for why this exists.

import { NextRequest, NextResponse } from "next/server";
import { listStaff } from "@/lib/sports-admin-api";

export async function GET(request: NextRequest) {
  const search = new URL(request.url).searchParams.get("search") ?? "";
  if (search.trim().length < 2) return NextResponse.json({ data: [] });
  try {
    const staff = await listStaff(search);
    return NextResponse.json({ data: staff });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
