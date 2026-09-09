// Authenticated proxy for the Bus Tracking client component's vehicle-select ->
// refetch flow -- same reasoning as /api/students-search: the access token
// lives in an httpOnly cookie a client component can't reach directly.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");
  const date = searchParams.get("date");

  if (!vehicleId) {
    return NextResponse.json({ message: "vehicleId is required" }, { status: 400 });
  }

  const query = new URLSearchParams({ vehicleId, ...(date ? { date } : {}) });
  const res = await apiFetch(`/transport-ops/bus-tracking?${query.toString()}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
