// Authenticated proxy for the Class Teacher "assign duty" search box -- same
// reasoning as /api/students-search: the access token lives in an httpOnly
// cookie a client component can't reach directly. Scoped to one real
// section (the caller's own advisor scope is re-checked server-side by the
// backend regardless of what sectionId this passes through).

import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get("sectionId") ?? "";
  const q = searchParams.get("q") ?? "";

  if (!sectionId || q.trim().length < 1) {
    return NextResponse.json({ data: [] });
  }

  const res = await apiFetch(`/faculty/class-teacher/sections/${sectionId}/students/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) {
    return NextResponse.json({ data: [] }, { status: res.status });
  }
  const body = (await res.json()) as { data: { studentId: string; studentName: string; rollNo: number | null }[] };
  return NextResponse.json(body);
}
