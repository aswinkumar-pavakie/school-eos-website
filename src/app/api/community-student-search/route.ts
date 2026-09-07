// Authenticated proxy for CommunityStudentPicker's client-side search box --
// same reasoning as /api/students-search: the access token lives in an
// httpOnly cookie a client component can't reach directly. Deliberately calls
// the Community-scoped /community-membership-requests/student-search
// endpoint, NOT the general /students?search= one -- that endpoint stays
// Admin/Principal-only, this one returns the same minimal fields
// (id/name/admissionNo) but is authorized for COMMUNITY specifically.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  if (search.trim().length < 2) {
    return NextResponse.json({ data: [] });
  }

  const query = new URLSearchParams({ search });
  const res = await apiFetch(`/community-membership-requests/student-search?${query.toString()}`);
  if (!res.ok) {
    return NextResponse.json({ data: [] }, { status: res.status });
  }

  const body = (await res.json()) as {
    data: { id: string; firstName: string; lastName: string | null; admissionNo: string }[];
  };

  return NextResponse.json({ data: body.data });
}
