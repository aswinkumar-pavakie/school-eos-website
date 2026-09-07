// Export for the Academic Calendar page -- reuses GET /calendar-events verbatim
// with the same academicYearId filter the page itself applies. scopeLabel below
// is a deliberate, small, verbatim duplicate of MonthCalendar.tsx's own
// same-named function -- not imported from it, since that component is a
// "use client" module and importing a plain function out of one into a server
// Route Handler is exactly the kind of fragile cross-boundary import that
// caused this route to 500 on first pass.

import { NextRequest } from "next/server";
import { csvResponse, rowsToCsv, type CsvColumn } from "@/lib/csv";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface NamedRow {
  id: string;
  name: string;
}

interface CalendarEventRow {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  isHoliday: boolean;
  startDate: string;
  endDate: string;
  scopeType: string;
  scopeId: string | null;
  scopeStage: string | null;
}

function scopeLabel(
  e: CalendarEventRow,
  lookups: { campuses: NamedRow[]; grades: NamedRow[]; sections: NamedRow[] },
): string {
  if (e.scopeType === "SCHOOL") return "Whole school";
  if (e.scopeType === "STAGE") return e.scopeStage?.replace(/_/g, " ") ?? "Stage";
  if (e.scopeType === "CAMPUS") return lookups.campuses.find((c) => c.id === e.scopeId)?.name ?? "Campus";
  if (e.scopeType === "GRADE") return lookups.grades.find((g) => g.id === e.scopeId)?.name ?? "Standard";
  if (e.scopeType === "SECTION") return lookups.sections.find((s) => s.id === e.scopeId)?.name ?? "Section";
  return e.scopeType;
}

export async function GET(request: NextRequest) {
  const academicYearId = request.nextUrl.searchParams.get("academicYearId") ?? "";

  const [eventsRes, campusesRes, gradesRes, sectionsRes] = await Promise.all([
    apiFetch(`/calendar-events?academicYearId=${academicYearId}`),
    apiFetch("/campuses"),
    apiFetch("/grades"),
    apiFetch("/sections?status=ACTIVE"),
  ]);
  const events: CalendarEventRow[] = eventsRes.ok ? ((await eventsRes.json()) as { data: CalendarEventRow[] }).data : [];
  const campuses: NamedRow[] = campusesRes.ok ? ((await campusesRes.json()) as { data: NamedRow[] }).data : [];
  const grades: NamedRow[] = gradesRes.ok ? ((await gradesRes.json()) as { data: NamedRow[] }).data : [];
  const sections: NamedRow[] = sectionsRes.ok ? ((await sectionsRes.json()) as { data: NamedRow[] }).data : [];
  const lookups = { campuses, grades, sections };

  const columns: CsvColumn<CalendarEventRow>[] = [
    { header: "Title", value: (e) => e.title },
    { header: "Type", value: (e) => e.eventType },
    { header: "Holiday", value: (e) => (e.isHoliday ? "Yes" : "No") },
    { header: "Start", value: (e) => formatDate(e.startDate) },
    { header: "End", value: (e) => formatDate(e.endDate) },
    { header: "Scope", value: (e) => scopeLabel(e, lookups) },
    { header: "Description", value: (e) => e.description ?? "" },
  ];

  return csvResponse(rowsToCsv(columns, events), "academic-calendar-events.csv");
}
