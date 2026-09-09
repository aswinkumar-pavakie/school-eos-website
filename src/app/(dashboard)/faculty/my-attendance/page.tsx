import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { KpiGrid, KpiCard } from "@/components/ui/KpiCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getMyAttendance } from "@/lib/faculty-staff-api";

function thisMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function MyAttendancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  try {
    const { month } = await searchParams;
    const selectedMonth = month || thisMonth();
    const { today, summary, days } = await getMyAttendance(selectedMonth);

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">My Attendance</h1>
          <p className="mt-1 text-sm text-text-muted">Your own real check-in history — read-only.</p>
        </div>

        <form action="/faculty/my-attendance" className="flex flex-wrap items-center gap-3">
          <input type="month" name="month" defaultValue={selectedMonth} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text" />
          <PlainButton type="submit" variant="secondary">Go</PlainButton>
        </form>

        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Today</p>
          {today.status ? (
            <div className="mt-2 flex items-center gap-3">
              <StatusPill state={today.status} />
              <span className="text-sm text-text-muted">{today.punchIn ? `In ${today.punchIn}` : ""}{today.punchOut ? ` · Out ${today.punchOut}` : ""}</span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-text-muted">No event recorded yet today.</p>
          )}
        </div>

        <KpiGrid>
          <KpiCard eyebrow="Attendance rate" value={summary.ratePercent !== null ? `${summary.ratePercent}%` : "—"} />
          <KpiCard eyebrow="Present" value={String(summary.presentCount)} />
          <KpiCard eyebrow="Absent" value={String(summary.absentCount)} />
          <KpiCard eyebrow="On duty" value={String(summary.onDutyCount)} />
        </KpiGrid>

        {days.length === 0 ? (
          <p className="text-sm text-text-muted">No attendance events recorded for this month.</p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead className="bg-field">
                <tr>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-text-muted">Date</th>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-text-muted">Status</th>
                  <th className="border-b border-border px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-text-muted">In</th>
                  <th className="border-b border-border px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-text-muted">Out</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.date} className="border-b border-border last:border-0 hover:bg-field/60">
                    <td className="px-4 py-2.5 text-text">{formatDate(d.date)}</td>
                    <td className="px-4 py-2.5">{d.status ? <StatusPill state={d.status} /> : "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-text">{d.punchIn ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-text">{d.punchOut ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your attendance. Nothing was changed — try again." />;
  }
}
