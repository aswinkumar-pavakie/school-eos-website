// Authenticated proxy for the Student Boarding client component's bus/date
// filter -> refetch flow -- same reasoning as /api/students-search.

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
  const res = await apiFetch(`/transport-ops/boarding-monitor?${query.toString()}`);
  const body = await res.json().catch(() => null);
  return NextResponse.json(body, { status: res.status });
}
