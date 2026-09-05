// Academic Calendar -- real data from calendar_event, which already existed fully
// populated (term dates, holidays, exam windows) with no API in front of it (see
// query.md).

import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { CreateCalendarEventForm } from "@/components/academics/CreateCalendarEventForm";
import { MonthCalendar, type CalendarEventRow } from "@/components/academics/MonthCalendar";
import { apiFetch } from "@/lib/api";

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}
interface NamedRow {
  id: string;
  name: string;
}

export default async function AcademicCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ academicYearId?: string }>;
}) {
  const params = await searchParams;

  const [yearsRes, campusesRes, gradesRes, sectionsRes] = await Promise.all([
    apiFetch("/academic-years"),
    apiFetch("/campuses"),
    apiFetch("/grades"),
    apiFetch("/sections?status=ACTIVE"),
  ]);
  const academicYears: AcademicYear[] = yearsRes.ok ? ((await yearsRes.json()) as { data: AcademicYear[] }).data : [];
  const campuses: NamedRow[] = campusesRes.ok ? ((await campusesRes.json()) as { data: NamedRow[] }).data : [];
  const grades: NamedRow[] = gradesRes.ok ? ((await gradesRes.json()) as { data: NamedRow[] }).data : [];
  const sections: NamedRow[] = sectionsRes.ok ? ((await sectionsRes.json()) as { data: NamedRow[] }).data : [];
  const currentYear = academicYears.find((y) => y.isCurrent);

  const query = new URLSearchParams();
  query.set("academicYearId", params.academicYearId || currentYear?.id || "");
  const res = await apiFetch(`/calendar-events?${query.toString()}`);
  const events: CalendarEventRow[] = res.ok ? ((await res.json()) as { data: CalendarEventRow[] }).data : [];

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Academic Calendar</h1>
          <p className="mt-1 text-sm text-text-muted">Term dates, holidays, exams, and school events.</p>
        </div>
        <CreateCalendarEventForm academicYears={academicYears} campuses={campuses} grades={grades} sections={sections} />
      </div>

      <form action="/admin/academic-calendar" className="mt-6 flex items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Academic year</span>
          <AutoSubmitSelect
            name="academicYearId"
            defaultValue={params.academicYearId || currentYear?.id || ""}
            className="min-w-[200px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary focus:bg-surface"
          >
            {academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </AutoSubmitSelect>
        </label>
      </form>

      <MonthCalendar events={events} campuses={campuses} grades={grades} sections={sections} />
    </div>
  );
}
