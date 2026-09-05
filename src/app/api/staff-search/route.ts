// Authenticated proxy for staff-search comboboxes (Class Advisor / Coordinator
// assignment) -- same reasoning as /api/persons-search and /api/students-search.
// Teaching-only: both roles this backs require an actual teacher, so non-teaching
// staff (bus attendants, accountants, etc.) are excluded here rather than left for
// the admin to filter out by eye.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  if (search.trim().length < 2) {
    return NextResponse.json({ data: [] });
  }

  const query = new URLSearchParams({ search, status: "ACTIVE", isTeaching: "true", limit: "8" });

  const res = await apiFetch(`/staff?${query.toString()}`);
  if (!res.ok) {
    return NextResponse.json({ data: [] }, { status: res.status });
  }

  const body = (await res.json()) as {
    data: {
      id: string;
      personId: string;
      firstName: string;
      lastName: string | null;
      employeeNo: string;
      designation: string | null;
    }[];
  };

  return NextResponse.json({
    data: body.data.map((s) => ({
      id: s.id,
      personId: s.personId,
      firstName: s.firstName,
      lastName: s.lastName,
      employeeNo: s.employeeNo,
      designation: s.designation,
    })),
  });
}
