import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { PlainButton } from "@/components/ui/Button";
import { formatCount, formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listFeeHeads, listObligations, listStudentFeeAssignments } from "@/lib/finance-api";
import { CreateObligationModal } from "./CreateObligationModal";
import { ObligationRowActions } from "./RowActions";

const STATE_OPTIONS = ["PENDING", "PARTIAL", "PAID", "WAIVED", "OVERDUE", "CANCELLED"];

export default async function ObligationsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentSearch?: string; state?: string; fromDate?: string; toDate?: string }>;
}) {
  const { studentSearch, state, fromDate, toDate } = await searchParams;
  try {
    const [{ data: obligations }, assignments, feeHeads] = await Promise.all([
      listObligations({
        studentSearch: studentSearch || undefined,
        state: state || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        pageSize: 200,
      }),
      listStudentFeeAssignments(),
      listFeeHeads(),
    ]);

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Obligations</h1>
            <p className="mt-1 text-sm text-text-muted">What's owed, per student, per instalment.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/finance/obligations/imports"><PlainButton variant="secondary">Bulk import</PlainButton></Link>
            <CreateObligationModal assignments={assignments} feeHeads={feeHeads} />
          </div>
        </div>

        <form action="/finance/obligations" className="flex flex-wrap items-center gap-3">
          <input
            name="studentSearch"
            defaultValue={studentSearch ?? ""}
            placeholder="Search by student name or admission no."
            className="min-w-64 flex-1 rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
          <select name="state" defaultValue={state ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Status: All</option>
            {STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" name="fromDate" defaultValue={fromDate ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text" />
          <span className="text-xs text-text-muted">to</span>
          <input type="date" name="toDate" defaultValue={toDate ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text" />
          <PlainButton type="submit" variant="secondary">Filter</PlainButton>
          <Link href="/finance/obligations" className="text-xs font-bold text-text-muted hover:text-text">Clear</Link>
        </form>

        {obligations.length === 0 ? (
          <EmptyState title="No obligations yet" body="They're normally generated automatically from an active fee structure; create one manually only for a genuine one-off." />
        ) : (
          <DataTable
            getKey={(o) => o.id}
            rows={obligations}
            columns={[
              {
                header: "Student",
                render: (o) => (
                  <Link href={`/finance/students/${o.studentId}`} className="font-bold text-primary hover:underline">
                    {o.studentDisplayName ?? o.studentId.slice(0, 8)}
                    {o.studentAdmissionNo ? ` (${o.studentAdmissionNo})` : ""}
                  </Link>
                ),
              },
              { header: "Instalment", render: (o) => o.instalmentNo },
              { header: "Due", render: (o) => formatDate(o.dueDate) },
              { header: "Paid / Owed", align: "right", render: (o) => formatCount(Number(BigInt(o.paidPaise) / BigInt(100)), Number(BigInt(o.amountPaise) / BigInt(100))) },
              { header: "Amount", align: "right", render: (o) => formatMoneySummary(o.amountPaise) },
              { header: "Status", render: (o) => <StatusPill state={o.state} /> },
              { header: "", render: (o) => <ObligationRowActions obligation={o} /> },
            ]}
          />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load obligations. Nothing was submitted — try again." />;
  }
}
