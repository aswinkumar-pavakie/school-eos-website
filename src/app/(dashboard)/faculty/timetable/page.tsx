import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getWeeklyTimetable } from "@/lib/faculty-academics-api";

const DAY_LABELS: Record<number, string> = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };
const DAY_SHORT: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };

function todayDow(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay;
}

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  try {
    const { day } = await searchParams;
    const selectedDay = day ? Math.min(Math.max(Number(day), 1), 6) : Math.min(todayDow(), 6);
    const { periods, days } = await getWeeklyTimetable();
    const daySlots = new Map(days.find((d) => d.dayOfWeek === selectedDay)?.slots.map((s) => [s.periodId, s]) ?? []);

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Timetable</h1>
          <p className="mt-1 text-sm text-text-muted">Your real weekly schedule.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((d) => (
            <Link
              key={d}
              href={`/faculty/timetable?day=${d}`}
              className={`rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-bold ${selectedDay === d ? "bg-primary text-white" : "border border-border bg-surface text-text-muted"}`}
            >
              {DAY_SHORT[d]}
            </Link>
          ))}
        </div>

        <h2 className="text-sm font-extrabold text-text">{DAY_LABELS[selectedDay]}</h2>

        {periods.length === 0 ? (
          <EmptyState title="No timetable configured" body="No periods are configured yet." />
        ) : (
          <div className="flex flex-col gap-2">
            {periods.map((p) => {
              const slot = daySlots.get(p.periodId);
              return (
                <div key={p.periodId} className={`flex items-center gap-4 rounded-[var(--radius-card)] border border-border p-4 ${p.isBreak ? "bg-field" : "bg-surface"}`}>
                  <div className="w-16 shrink-0">
                    <p className="font-mono text-sm font-bold text-text">{p.startTime.slice(0, 5)}</p>
                    <p className="font-mono text-xs text-text-muted">{p.endTime.slice(0, 5)}</p>
                  </div>
                  <div className="h-10 w-px shrink-0 bg-border" />
                  <div className="min-w-0">
                    {p.isBreak ? (
                      <p className="text-sm italic font-semibold text-text-muted">{p.label ?? "Break"}</p>
                    ) : slot ? (
                      <>
                        <p className="text-sm font-bold text-text">{slot.subjectName}</p>
                        <p className="text-xs text-text-muted">{slot.gradeName} {slot.sectionName}{slot.room ? ` · ${slot.room}` : ""}</p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-text-muted">Free · {p.label ?? `Period ${p.periodNo}`}</p>
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
