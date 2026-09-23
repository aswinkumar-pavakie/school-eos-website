// Academic Calendar -- now renders the shared src/components/shared-ui/
// AcademicCalendarView, the same canonical screen Faculty's own
// faculty/calendar/page.tsx renders (see that component's own header
// comment). Real calendar_event rows (getCalendar), scoped to the school-
// wide + this child's real stage -- same real data as before, only the
// presentation is now shared rather than a parent-specific reskin.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { getCalendar, listChildren, resolveSelectedChild } from "@/lib/parent-api";
import { AcademicCalendarView } from "@/components/shared-ui/AcademicCalendarView";

export default async function ParentCalendarPage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const [children, actor] = await Promise.all([listChildren(), getCurrentActor()]);
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const events = await getCalendar(selected.studentId);

    return <AcademicCalendarView events={events} personId={actor.personId} scope="parent" />;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the calendar."} />;
  }
}
