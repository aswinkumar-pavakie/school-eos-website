import Link from "next/link";
import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { orDash } from "@/lib/format";
import { getTimetable, listChildren, resolveSelectedChild } from "@/lib/parent-api";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function ParentTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; day?: string }>;
}) {
  try {
    const { studentId: requestedStudentId, day: requestedDay } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const { periods, slots } = await getTimetable(selected.studentId);
    const days = [...new Set(slots.map((s) => s.dayOfWeek))].sort((a, b) => a - b);

    const header = (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Timetable</h1>
          <p className="mt-1 text-sm text-text-muted">
            {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join(" ")}
          </p>
        </div>
        <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
      </div>
    );

    if (days.length === 0) {
      return (
        <div className="mx-auto max-w-[1280px]">
          {header}
          <div className="mt-6">
            <EmptyState title="No timetable yet" body="No timetable has been published for this class yet." />
          </div>
        </div>
      );
    }

    const todayDow = new Date().getDay();
    const requestedNum = requestedDay ? Number(requestedDay) : NaN;
    const selectedDay = days.includes(requestedNum) ? requestedNum : days.includes(todayDow) ? todayDow : days[0]!;

    const daySlots = new Map(slots.filter((s) => s.dayOfWeek === selectedDay).map((s) => [s.periodId, s]));
    const sortedPeriods = [...periods].sort((a, b) => a.periodNo - b.periodNo);

    return (
      <div className="mx-auto max-w-[1280px]">
        {header}

        <div className="mt-6 flex flex-wrap gap-2">
          {days.map((d) => (
            <Link
              key={d}
              href={`/parent/timetable?studentId=${selected.studentId}&day=${d}`}
              className={`rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-bold ${
                selectedDay === d ? "bg-primary text-white" : "border border-border bg-surface text-text-muted"
              }`}
            >
              {DAY_SHORT[d]}
            </Link>
          ))}
        </div>

        <h2 className="mt-6 text-sm font-extrabold text-text">{DAY_LABELS[selectedDay]}</h2>

        {sortedPeriods.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="No periods configured" body="No periods are configured yet." />
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {sortedPeriods.map((p) => {
              const slot = daySlots.get(p.periodId);
              return (
                <div
                  key={p.periodId}
                  className={`flex items-center gap-4 rounded-[var(--radius-card)] border border-border p-4 ${p.isBreak ? "bg-field" : "bg-surface"}`}
                >
                  <div className="w-16 shrink-0">
                    <p className="font-mono text-sm font-bold text-text">{p.startTime.slice(0, 5)}</p>
                    <p className="font-mono text-xs text-text-muted">{p.endTime.slice(0, 5)}</p>
                  </div>
                  <div className="h-10 w-px shrink-0 bg-border" />
                  <div className="min-w-0">
                    {p.isBreak ? (
                      <p className="text-sm font-semibold italic text-text-muted">{p.label || "Break"}</p>
                    ) : slot ? (
                      <>
                        <p className="text-sm font-bold text-text">{slot.subjectName}</p>
                        <p className="text-xs text-text-muted">
                          {orDash(slot.teacherName)}
                          {slot.room ? ` · ${slot.room}` : ""}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-text-muted">Free · {p.label}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your timetable. Nothing was changed — try again." />;
  }
}
