// Authenticated proxy for Live Tracking's polling refresh -- same reasoning
// as the existing transport-ops-bus-tracking proxy: the access token lives in
// an httpOnly cookie a client component can't reach directly.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const res = await apiFetch(`/transport-ops/bus-tracking/fleet${query}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
