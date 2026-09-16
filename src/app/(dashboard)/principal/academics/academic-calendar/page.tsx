// Principal -> Academic Calendar: the same real calendar_event data Admin's
// own page shows (term dates, holidays, exam windows, PTMs, functions,
// competitions, working Saturdays), pixel-matched to the SIS mockup's own
// calendar screen. Per the mockup's real "+ Add event" flow (and explicit
// user confirmation superseding this page's earlier view-only design),
// Principal can now really add new events -- see calendar-events.controller.ts
// (@Roles('ADMIN', 'PRINCIPAL') on POST) and this route's own actions.ts.
// Removing an event Principal didn't add stays Admin-only (readOnly stays on
// the Delete affordance specifically, not the page as a whole).

import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { MonthCalendar, type CalendarEventRow } from "@/components/academics/MonthCalendar";
import { apiFetch, getCurrentActor } from "@/lib/api";
import { createPrincipalCalendarEventAction } from "./actions";

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}
interface NamedRow {
  id: string;
  name: string;
}

export default async function PrincipalAcademicCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ academicYearId?: string }>;
}) {
  const params = await searchParams;

  const [yearsRes, campusesRes, gradesRes, sectionsRes, actor] = await Promise.all([
    apiFetch("/academic-years"),
    apiFetch("/campuses"),
    apiFetch("/grades"),
    apiFetch("/sections?status=ACTIVE"),
    getCurrentActor().catch(() => null),
  ]);
  const academicYears: AcademicYear[] = yearsRes.ok ? ((await yearsRes.json()) as { data: AcademicYear[] }).data : [];
  const campuses: NamedRow[] = campusesRes.ok ? ((await campusesRes.json()) as { data: NamedRow[] }).data : [];
  const grades: NamedRow[] = gradesRes.ok ? ((await gradesRes.json()) as { data: NamedRow[] }).data : [];
  const sections: NamedRow[] = sectionsRes.ok ? ((await sectionsRes.json()) as { data: NamedRow[] }).data : [];
  const currentYear = academicYears.find((y) => y.isCurrent);
  const selectedYearId = params.academicYearId || currentYear?.id || "";

  const query = new URLSearchParams();
  query.set("academicYearId", selectedYearId);
  const res = await apiFetch(`/calendar-events?${query.toString()}`);

  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load the Academic Calendar</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const events: CalendarEventRow[] = ((await res.json()) as { data: CalendarEventRow[] }).data;

  const yearFilter = (
    <form action="/principal/academics/academic-calendar" className="flex items-end gap-3">
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
  );

  return (
    <div className="mx-auto max-w-[1100px]">
      <MonthCalendar
        title="Academic Calendar"
        subtitle={`Academic year ${currentYear?.name ?? "—"} · published events are read-only · you can add new events.`}
        yearFilter={yearFilter}
        events={events}
        campuses={campuses}
        grades={grades}
        sections={sections}
        readOnly
        academicYearId={selectedYearId || undefined}
        createAction={createPrincipalCalendarEventAction}
        currentPersonId={actor?.personId}
      />
    </div>
  );
}
