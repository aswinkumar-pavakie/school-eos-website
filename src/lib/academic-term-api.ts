// Real academic_term reads -- design-reframe addition, backs the header's
// Term pill on Principal/Admin/Vice Principal. Returns [] (not an error) when
// the table doesn't exist yet -- the header pill just renders nothing until
// the user runs query.md's CREATE TABLE + seed INSERT.

import { apiFetch } from "./api";

export interface AcademicTerm {
  id: string;
  academicYearId: string;
  termNumber: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
}

export async function listAcademicTerms(academicYearId?: string): Promise<AcademicTerm[]> {
  const query = academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : "";
  const res = await apiFetch(`/academic-terms${query}`);
  if (!res.ok) return [];
  const body = (await res.json().catch(() => null)) as { data?: AcademicTerm[] } | null;
  return body?.data ?? [];
}
