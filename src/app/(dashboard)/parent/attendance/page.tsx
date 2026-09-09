import Link from "next/link";
import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { KpiGrid, KpiCard } from "@/components/ui/KpiCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getAttendance, listChildren, resolveSelectedChild } from "@/lib/parent-api";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(year!, mon! - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(year!, mon! - 1, 1);
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default async function ParentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; month?: string }>;
}) {
  try {
    const { studentId: requestedStudentId, month: requestedMonth } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const month = requestedMonth ?? currentMonth();
    const { summary, days } = await getAttendance(selected.studentId, month);
    const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Attendance</h1>
            <p className="mt-1 text-sm text-text-muted">
              {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join(" ")}
            </p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        <div className="mt-6">
          <KpiGrid>
            <KpiCard eyebrow="Present" value={String(summary.presentCount)} delta={`of ${summary.totalCount} days`} />
            <KpiCard eyebrow="Attendance" value={`${summary.percentage}%`} />
          </KpiGrid>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href={`/parent/attendance?studentId=${selected.studentId}&month=${shiftMonth(month, -1)}`}
            className="rounded-[var(--radius-input)] border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text hover:border-primary/40"
          >
            ← Prev
          </Link>
          <p className="text-sm font-bold text-text">{monthLabel(month)}</p>
          <Link
            href={`/parent/attendance?studentId=${selected.studentId}&month=${shiftMonth(month, 1)}`}
            className="rounded-[var(--radius-input)] border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text hover:border-primary/40"
          >
            Next →
          </Link>
        </div>

        <div className="mt-4 rounded-[var(--radius-card)] border border-border bg-surface p-4">
          {sortedDays.length === 0 ? (
            <EmptyState title="No attendance recorded" body="Nothing recorded for this month yet." />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {sortedDays.map((d) => (
                <li key={d.date} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-text">{formatDate(d.date)}</span>
                  <StatusPill state={d.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load attendance. Nothing was changed — try again." />;
  }
}
