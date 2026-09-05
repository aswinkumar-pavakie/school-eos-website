// Backs the navbar's "Jump to a page" search -- fans out to the real
// Students/Faculty/Parents list endpoints (name/admission-no/employee-no search,
// already built) and returns a combined, linkable result set. No mock data --
// empty query in, empty results out.

import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

interface SearchResult {
  type: "student" | "staff" | "parent";
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (q.trim().length < 2) {
    return NextResponse.json({ data: [] });
  }

  const query = new URLSearchParams({ search: q, limit: "5" });

  const [studentsRes, staffRes, parentsRes] = await Promise.all([
    apiFetch(`/students?${query.toString()}`),
    apiFetch(`/staff?${query.toString()}`),
    apiFetch(`/parents?${query.toString()}`),
  ]);

  const results: SearchResult[] = [];

  if (studentsRes.ok) {
    const { data } = (await studentsRes.json()) as {
      data: { id: string; firstName: string; lastName: string | null; admissionNo: string }[];
    };
    for (const s of data) {
      results.push({
        type: "student",
        id: s.id,
        label: `${s.firstName} ${s.lastName ?? ""}`.trim(),
        sublabel: `Student · ${s.admissionNo}`,
        href: `/admin/students/${s.id}`,
      });
    }
  }

  if (staffRes.ok) {
    const { data } = (await staffRes.json()) as {
      data: { id: string; firstName: string; lastName: string | null; employeeNo: string }[];
    };
    for (const s of data) {
      results.push({
        type: "staff",
        id: s.id,
        label: `${s.firstName} ${s.lastName ?? ""}`.trim(),
        sublabel: `Faculty · ${s.employeeNo}`,
        href: `/admin/faculty/${s.id}`,
      });
    }
  }

  if (parentsRes.ok) {
    const { data } = (await parentsRes.json()) as {
      data: { id: string; firstName: string; lastName: string | null; mobile: string | null }[];
    };
    for (const p of data) {
      results.push({
        type: "parent",
        id: p.id,
        label: `${p.firstName} ${p.lastName ?? ""}`.trim(),
        sublabel: `Parent${p.mobile ? ` · ${p.mobile}` : ""}`,
        href: `/admin/parents/${p.id}`,
      });
    }
  }

  return NextResponse.json({ data: results });
}
