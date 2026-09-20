// Authenticated proxy for AddIndentPanel's equipment picker -- see
// /api/sports-admin/teams/route.ts's own header comment for why this exists.

import { NextResponse } from "next/server";
import { listEquipmentCatalog } from "@/lib/sports-admin-api";

export async function GET() {
  try {
    const items = await listEquipmentCatalog();
    return NextResponse.json({ data: items });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
