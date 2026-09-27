// Authenticated proxy for the Health In-charge student picker (GET /health-incharge/students).
// The backend route is HEALTH_INCHARGE-only, so any other login just gets an empty list.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET(request: NextRequest) {
  const search = new URL(request.url).searchParams.get("search") ?? "";
  if (search.trim().length < 2) return NextResponse.json({ data: [] });

  const res = await apiFetch(`/health-incharge/students?search=${encodeURIComponent(search.trim())}`);
  if (!res.ok) return NextResponse.json({ data: [] }, { status: res.status });
  return NextResponse.json(await res.json());
}
