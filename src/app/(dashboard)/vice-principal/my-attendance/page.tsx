import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getMyAttendanceHistory } from "@/lib/principal-staff-api";

function thisMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function PrincipalMyAttendancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const selectedMonth = month || thisMonth();

  // Data fetching kept in its own try/catch, separate from the JSX below --
  // React doesn't actually catch render errors via a JS try/catch around
  // constructed JSX (only a real error boundary does).
  let monthlySummary: Awaited<ReturnType<typeof getMyAttendanceHistory>>["monthlySummary"];
  let allTimeSummary: Awaited<ReturnType<typeof getMyAttendanceHistory>>["allTimeSummary"];
  let days: Awaited<ReturnType<typeof getMyAttendanceHistory>>["days"];
  try {
    ({ monthlySummary, allTimeSummary, days } = await getMyAttendanceHistory(selectedMonth));
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your attendance. Nothing was changed — try again." />;
  }

  return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">My Attendance</h1>
          <p className="mt-1.5 text-sm text-text-muted">Your own real check-in history — read-only.</p>
        </div>

        <form action="/vice-principal/my-attendance" className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            name="month"
            defaultValue={selectedMonth}
            className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text"
          />
          <PlainButton type="submit" variant="secondary">Go</PlainButton>
        </form>

        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
          <KpiCard
            eyebrow="This month"
            value={monthlySummary.percentage !== null ? `${monthlySummary.percentage}%` : "—"}
            detail={`${monthlySummary.presentCount} present of ${monthlySummary.totalCount} day(s) marked`}
            pctBadge={monthlySummary.percentage !== null ? `${monthlySummary.percentage}%` : undefined}
            bar={monthlySummary.percentage ?? undefined}
          />
          <KpiCard
            eyebrow="All time"
            value={allTimeSummary.percentage !== null ? `${allTimeSummary.percentage}%` : "—"}
            detail={`${allTimeSummary.presentCount} present of ${allTimeSummary.totalCount} day(s) marked`}
            pctBadge={allTimeSummary.percentage !== null ? `${allTimeSummary.percentage}%` : undefined}
            bar={allTimeSummary.percentage ?? undefined}
          />
        </div>

        {days.length === 0 ? (
          <p className="text-sm text-text-muted">No attendance events recorded for this month.</p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead className="bg-field">
                <tr>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-text-muted">Date</th>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-text-muted">Status</th>
                  <th className="border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-text-muted">Reason</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.date} className="border-b border-border last:border-0 hover:bg-field/60">
                    <td className="px-4 py-2.5 text-text">{formatDate(d.date)}</td>
                    <td className="px-4 py-2.5">
                      <StatusPill state={d.status === "CHECK_IN" ? "PRESENT" : "ABSENT"} />
                    </td>
                    <td className="px-4 py-2.5 text-text-muted">{d.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
}
