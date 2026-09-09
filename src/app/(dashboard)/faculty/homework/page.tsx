import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { KpiGrid, KpiCard } from "@/components/ui/KpiCard";
import { AuthExpiredError } from "@/lib/api";
import { formatDate, orDash } from "@/lib/format";
import { listHomework, getHomeworkRoster } from "@/lib/faculty-api";
import { HomeworkModal } from "./HomeworkModal";
import { closeHomeworkAction, deleteHomeworkAction } from "./actions";

export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ rosterId?: string; tab?: "DONE" | "NOT_DONE" }>;
}) {
  try {
    const { rosterId, tab } = await searchParams;
    const { items, classes, stats } = await listHomework();
    const activeTab = tab === "NOT_DONE" ? "NOT_DONE" : "DONE";

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Homework</h1>
            <p className="mt-1 text-sm text-text-muted">Assigned across your classes.</p>
          </div>
          <HomeworkModal classes={classes} />
        </div>

        <KpiGrid>
          <KpiCard eyebrow="Open" value={String(stats.open)} />
          <KpiCard eyebrow="Due today" value={String(stats.dueToday)} />
          <KpiCard eyebrow="Ungraded" value={String(stats.ungraded)} />
        </KpiGrid>

        {items.length === 0 ? (
          <EmptyState title="No homework yet" body="Post your first assignment above." />
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((hw) => {
              const pct = hw.total > 0 ? Math.round((hw.finishedCount / hw.total) * 100) : 0;
              const isOpen = rosterId === hw.id;
              return (
                <div key={hw.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text">{hw.title}</p>
                      <p className="text-xs text-text-muted">{hw.subjectName} · {hw.gradeName} {hw.sectionName} · Due {formatDate(hw.dueDate)}</p>
                    </div>
                    <span className="shrink-0 rounded-[7px] bg-field px-2 py-0.5 text-xs font-bold text-text-muted">{hw.status}</span>
                  </div>
                  {hw.description ? <p className="mt-2 text-sm text-text">{hw.description}</p> : null}

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-field">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="shrink-0 font-mono text-xs font-bold text-text">{hw.finishedCount}/{hw.total}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <HomeworkModal classes={classes} homework={hw} />
                    {hw.status === "PUBLISHED" ? (
                      <form action={closeHomeworkAction.bind(null, hw.id)}>
                        <PlainButton type="submit" variant="secondary">Close</PlainButton>
                      </form>
                    ) : null}
                    <form action={deleteHomeworkAction.bind(null, hw.id)}>
                      <PlainButton type="submit" variant="danger">Delete</PlainButton>
                    </form>
                    <Link
                      href={isOpen ? "/faculty/homework" : `/faculty/homework?rosterId=${hw.id}&tab=DONE`}
                      className="ml-auto text-sm font-semibold text-primary hover:underline"
                    >
                      {isOpen ? "Hide submissions" : "View submissions"}
                    </Link>
                  </div>

                  {isOpen ? <Roster homeworkId={hw.id} tab={activeTab} /> : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load homework. Nothing was changed — try again." />;
  }
}

async function Roster({ homeworkId, tab }: { homeworkId: string; tab: "DONE" | "NOT_DONE" }) {
  const { roster } = await getHomeworkRoster(homeworkId, tab);

  return (
    <div className="mt-3 rounded-[var(--radius-input)] border border-border bg-field p-3">
      <div className="flex gap-2">
        <Link
          href={`/faculty/homework?rosterId=${homeworkId}&tab=DONE`}
          className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-bold ${tab === "DONE" ? "bg-primary text-white" : "bg-surface text-text-muted"}`}
        >
          Completed
        </Link>
        <Link
          href={`/faculty/homework?rosterId=${homeworkId}&tab=NOT_DONE`}
          className={`rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-bold ${tab === "NOT_DONE" ? "bg-primary text-white" : "bg-surface text-text-muted"}`}
        >
          Not submitted
        </Link>
      </div>
      {roster.length === 0 ? (
        <p className="mt-3 text-center text-sm text-text-muted">{tab === "DONE" ? "No submissions yet." : "Everyone has submitted."}</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {roster.map((r) => (
            <li key={r.studentId} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-text">{r.studentName} <span className="text-text-muted">· Roll {orDash(r.rollNo)}</span></span>
              <span className="text-text-muted">
                {r.status === "GRADED" ? `Graded${r.marksAwarded !== null ? ` · ${r.marksAwarded}` : ""}` : r.status === "LATE" ? "Submitted late" : r.status === "SUBMITTED" ? "Submitted" : "Not submitted"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
