// Authenticated proxy for EnrollStudentForm's "Access" line -- when an
// existing parent is selected as father/mother, this returns their real
// current children count so "Parent app · N children" (after this new
// admission adds one more) is a real number, not a fabricated "1 child".

import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get("parentId") ?? "";

  if (!parentId) {
    return NextResponse.json({ count: 0 });
  }

  const res = await apiFetch(`/parents/${parentId}`);
  if (!res.ok) {
    return NextResponse.json({ count: 0 }, { status: res.status });
  }

  const body = (await res.json()) as { data: { children: { status: string }[] } };
  const count = body.data.children.filter((c) => c.status === "ACTIVE").length;

  return NextResponse.json({ count });
}
