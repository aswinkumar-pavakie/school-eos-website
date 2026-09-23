// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isTimetable"
// screen. Reuses EXISTING real getWeeklyTimetable() unchanged. Now renders
// the shared src/components/shared-ui/TimetableView -- Faculty's screen is
// the canonical design every other role's own Timetable feature also
// renders verbatim (see parent/timetable/page.tsx).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getWeeklyTimetable } from "@/lib/faculty-academics-api";
import { TimetableView, type TimetableCell } from "@/components/shared-ui/TimetableView";

function todayDow(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay;
}

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ view?: string; day?: string }> }) {
  try {
    const { view, day } = await searchParams;
    const isWeek = view === "week";
    const selectedDay = day ? Math.min(Math.max(Number(day), 1), 6) : Math.min(todayDow(), 6);
    const { periods, days } = await getWeeklyTimetable();

    const cells: TimetableCell[] = days.flatMap((d) =>
      d.slots.map((s) => ({
        periodId: s.periodId,
        dayOfWeek: d.dayOfWeek,
        title: s.subjectName,
        subtitle: [s.gradeName, s.sectionName].filter(Boolean).join(" "),
        tag: s.room ?? null,
      })),
    );

    return (
      <TimetableView
        periods={periods}
        cells={cells}
        basePath="/faculty/timetable"
        subtitle="Your real weekly schedule"
        isWeek={isWeek}
        selectedDay={selectedDay}
      />
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your timetable. Nothing was changed -- try again." />;
  }
}
