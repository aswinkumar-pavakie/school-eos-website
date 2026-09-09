import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { AuthExpiredError } from "@/lib/api";
import { getCoordinatorStructure, getCoordinatorTimetable, getCoordinatorOfferings } from "@/lib/faculty-coordinator-api";
import { SlotModal } from "./SlotModal";
import { deleteSlotAction, publishTimetableAction } from "../actions";

const DAY_SHORT: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };

export default async function CoordinatorTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ sectionId?: string; day?: string }>;
}) {
  try {
    const { sectionId: sectionIdParam, day } = await searchParams;
    const { sections } = await getCoordinatorStructure();
    const sectionId = sectionIdParam || sections[0]?.sectionId;
    const selectedDay = day ? Number(day) : 1;

    return (
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/faculty/coordinator" className="text-xs font-semibold text-text-muted hover:text-text">← Coordinator</Link>
          <h1 className="mt-1 text-2xl font-extrabold text-text">Class Timetable</h1>
          <p className="mt-1 text-sm text-text-muted">A draft stays invisible to the real teacher until you publish it.</p>
        </div>

        {sections.length === 0 ? (
          <ErrorState message="No sections in your scope." />
        ) : (
          <>
            <form action="/faculty/coordinator/timetable" className="flex flex-wrap items-center gap-3">
              <select name="sectionId" defaultValue={sectionId} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
                {sections.map((s) => (
                  <option key={s.sectionId} value={s.sectionId}>{s.gradeName} {s.sectionName}</option>
                ))}
              </select>
              <PlainButton type="submit" variant="secondary">Go</PlainButton>
            </form>

            {sectionId ? <TimetableGrid sectionId={sectionId} selectedDay={selectedDay} /> : null}
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the timetable. Nothing was changed — try again." />;
  }
}

async function TimetableGrid({ sectionId, selectedDay }: { sectionId: string; selectedDay: number }) {
  const [{ periods, slots }, offerings] = await Promise.all([
    getCoordinatorTimetable(sectionId),
    getCoordinatorOfferings({ sectionId }),
  ]);
  const daySlots = new Map(slots.filter((s) => s.dayOfWeek === selectedDay).map((s) => [s.periodId, s]));
  const draftCount = slots.filter((s) => s.isDraft).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((d) => (
            <Link
              key={d}
              href={`/faculty/coordinator/timetable?sectionId=${sectionId}&day=${d}`}
              className={`rounded-[var(--radius-pill)] px-3.5 py-2 text-sm font-bold ${selectedDay === d ? "bg-primary text-white" : "border border-border bg-surface text-text-muted"}`}
            >
              {DAY_SHORT[d]}
            </Link>
          ))}
        </div>
        {draftCount > 0 ? (
          <form action={publishTimetableAction.bind(null, sectionId)}>
            <PlainButton type="submit" variant="primary">Publish {draftCount} draft{draftCount === 1 ? "" : "s"}</PlainButton>
          </form>
        ) : null}
      </div>

      {periods.length === 0 ? (
        <p className="text-sm text-text-muted">No periods configured for this section&apos;s stage.</p>
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
                <div className="min-w-0 flex-1">
                  {p.isBreak ? (
                    <p className="text-sm italic font-semibold text-text-muted">{p.label ?? "Break"}</p>
                  ) : slot ? (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-text">{slot.subjectName}{slot.isDraft ? <span className="ml-2 rounded-[7px] bg-pending-bg px-1.5 py-0.5 text-xs font-bold text-pending-text">Draft</span> : null}</p>
                        <p className="text-xs text-text-muted">{slot.teacherName ?? "Unassigned teacher"}</p>
                      </div>
                      {slot.isDraft ? (
                        <form action={deleteSlotAction.bind(null, slot.slotId)}>
                          <PlainButton type="submit" variant="danger">Remove</PlainButton>
                        </form>
                      ) : null}
                    </div>
                  ) : (
                    <SlotModal sectionId={sectionId} dayOfWeek={selectedDay} periodId={p.periodId} periodLabel={p.label ?? `Period ${p.periodNo}`} offerings={offerings} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
