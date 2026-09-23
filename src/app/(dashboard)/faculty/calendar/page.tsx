// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isCalendar" screen.
// Reuses EXISTING real getFacultyCalendar() unchanged for school-wide
// events. Now renders the shared src/components/shared-ui/AcademicCalendarView
// -- Faculty's screen is the canonical design every other role's own
// Academic Calendar feature also renders verbatim (see e.g.
// parent/academic-calendar/page.tsx), so this one component is the single
// source of truth, not a per-role copy. Personal events are real, private-
// per-user browser storage -- see that component's own header comment for
// why (no backend support exists anywhere for this, confirmed in both
// school-eos-backend and the mobile app).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { getFacultyCalendar } from "@/lib/faculty-academics-api";
import { AcademicCalendarView } from "@/components/shared-ui/AcademicCalendarView";

export default async function CalendarPage() {
  try {
    const [{ events }, actor] = await Promise.all([getFacultyCalendar(), getCurrentActor()]);
    return (
      <AcademicCalendarView
        events={events}
        personId={actor.personId}
        storageKeyOverride={`faculty-calendar-personal-events:${actor.personId}`}
      />
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the calendar. Nothing was changed -- try again." />;
  }
}
