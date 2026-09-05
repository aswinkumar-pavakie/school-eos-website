// Authenticated proxy for InventoryItemPicker's client-side search box -- same
// reasoning as /api/students-search: the access token lives in an httpOnly
// cookie a client component can't reach directly.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  if (search.trim().length < 2) {
    return NextResponse.json({ data: [] });
  }

  const query = new URLSearchParams({ search, limit: "8" });

  const res = await apiFetch(`/inventory-items?${query.toString()}`);
  if (!res.ok) {
    return NextResponse.json({ data: [] }, { status: res.status });
  }

  const body = (await res.json()) as {
    data: { id: string; name: string; assetCode: string | null; status: string }[];
  };

  return NextResponse.json({
    data: body.data.map((i) => ({
      id: i.id,
      name: i.name,
      assetCode: i.assetCode,
      status: i.status,
    })),
  });
}
