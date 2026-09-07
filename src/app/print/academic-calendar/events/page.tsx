import { PrintReportHeader, PrintReportStyles } from "@/components/dashboard/PrintReport";
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

// Deliberate, small, verbatim duplicate of MonthCalendar.tsx's own scopeLabel --
// not imported from it, since that component is "use client" and importing a
// plain function out of a client module into a server page is the exact
// cross-boundary pattern that already broke the sibling CSV export route once.
function scopeLabel(e: CalendarEventRow, lookups: { campuses: NamedRow[]; grades: NamedRow[]; sections: NamedRow[] }): string {
  if (e.scopeType === "SCHOOL") return "Whole school";
  if (e.scopeType === "STAGE") return e.scopeStage?.replace(/_/g, " ") ?? "Stage";
  if (e.scopeType === "CAMPUS") return lookups.campuses.find((c) => c.id === e.scopeId)?.name ?? "Campus";
  if (e.scopeType === "GRADE") return lookups.grades.find((g) => g.id === e.scopeId)?.name ?? "Standard";
  if (e.scopeType === "SECTION") return lookups.sections.find((s) => s.id === e.scopeId)?.name ?? "Section";
  return e.scopeType;
}

export default async function AcademicCalendarPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ academicYearId?: string }>;
}) {
  const params = await searchParams;
  const academicYearId = params.academicYearId ?? "";

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

  return (
    <div className="p-8">
      <PrintReportStyles />
      <PrintReportHeader title="Academic Calendar Report" subtitle={`${events.length} events`} />
      <table className="report-table w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b-2 border-border text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">
            <th className="py-2 pr-3">Title</th>
            <th className="py-2 pr-3">Type</th>
            <th className="py-2 pr-3">Holiday</th>
            <th className="py-2 pr-3">Start</th>
            <th className="py-2 pr-3">End</th>
            <th className="py-2 pr-3">Scope</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-b border-border">
              <td className="py-2 pr-3">{e.title}</td>
              <td className="py-2 pr-3">{e.eventType.replace(/_/g, " ")}</td>
              <td className="py-2 pr-3">{e.isHoliday ? "Yes" : "No"}</td>
              <td className="py-2 pr-3">{formatDate(e.startDate)}</td>
              <td className="py-2 pr-3">{formatDate(e.endDate)}</td>
              <td className="py-2 pr-3">{scopeLabel(e, lookups)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
