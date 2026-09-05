// Thin authenticated proxy for GuardianPersonPicker's client-side search box.
// Client components can't call apiFetch directly (the access token lives in an
// httpOnly cookie, invisible to browser JS) -- this Route Handler runs server-side,
// attaches the real session, and forwards only what a name-search combobox needs.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const roleCode = searchParams.get("roleCode") ?? "";

  if (search.trim().length < 2) {
    return NextResponse.json({ data: [] });
  }

  const query = new URLSearchParams({ search, limit: "8" });
  if (roleCode) query.set("roleCode", roleCode);

  const res = await apiFetch(`/persons?${query.toString()}`);
  if (!res.ok) {
    return NextResponse.json({ data: [] }, { status: res.status });
  }

  const body = (await res.json()) as {
    data: { id: string; firstName: string; lastName: string | null; mobile: string | null; email: string | null }[];
  };

  return NextResponse.json({
    data: body.data.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      mobile: p.mobile,
      email: p.email,
    })),
  });
}
