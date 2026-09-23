// Timetable -- now renders the shared src/components/shared-ui/
// TimetableView, the same canonical screen Faculty's own
// faculty/timetable/page.tsx renders. Real timetable_slot data
// (getTimetable) -- same real data as before, only the presentation is now
// shared rather than a parent-specific reskin.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getTimetable, listChildren, resolveSelectedChild } from "@/lib/parent-api";
import { TimetableView, type TimetableCell } from "@/components/shared-ui/TimetableView";

function todayDow(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay;
}

export default async function ParentTimetablePage({ searchParams }: { searchParams: Promise<{ studentId?: string; view?: string; day?: string }> }) {
  try {
    const { studentId: requestedStudentId, view, day } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const { periods, slots } = await getTimetable(selected.studentId);
    const isWeek = view === "week";
    const selectedDay = day ? Math.min(Math.max(Number(day), 1), 6) : Math.min(todayDow(), 6);

    const cells: TimetableCell[] = slots.map((s) => ({
      periodId: s.periodId,
      dayOfWeek: s.dayOfWeek,
      title: s.subjectName,
      subtitle: s.teacherName ?? null,
      tag: null,
    }));

    return (
      <div className="parent-scope">
        <TimetableView
          periods={periods}
          cells={cells}
          basePath={`/parent/timetable?studentId=${selected.studentId}`}
          subtitle={`${selected.studentName} · ${[selected.gradeName, selected.sectionName].filter(Boolean).join("-")}`}
          isWeek={isWeek}
          selectedDay={selectedDay}
        />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the timetable."} />;
  }
}
