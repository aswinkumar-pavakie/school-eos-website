import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { KpiCard, KpiGrid } from "@/components/ui/KpiCard";
import { PlainButton } from "@/components/ui/Button";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listGrades, listStudents } from "@/lib/finance-api";

export default async function FeePaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; gradeId?: string; dueStatus?: string }>;
}) {
  const { search, gradeId, dueStatus } = await searchParams;
  try {
    const [{ data: students, meta }, grades] = await Promise.all([
      listStudents({ search: search || undefined, gradeId: gradeId || undefined, dueStatus: dueStatus || undefined, pageSize: 50 }),
      listGrades(),
    ]);

    const totalDemand = students.reduce((sum, s) => sum + BigInt(s.totalDemandPaise), BigInt(0));
    const totalCollected = students.reduce((sum, s) => sum + BigInt(s.paidPaise), BigInt(0));
    const totalOutstanding = students.reduce((sum, s) => sum + BigInt(s.outstandingPaise), BigInt(0));
    const withDues = students.filter((s) => s.outstandingPaise !== "0").length;

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Fee Payments</h1>
            <p className="mt-1 text-sm text-text-muted">Receive payments, review receipts and track the fee ledger.</p>
          </div>
        </div>

        <KpiGrid>
          <KpiCard eyebrow="Records in view" value={String(meta?.total ?? students.length)} />
          <KpiCard eyebrow="Total demand" value={formatMoneySummary(totalDemand.toString())} />
          <KpiCard eyebrow="Total collected" value={formatMoneySummary(totalCollected.toString())} />
          <KpiCard eyebrow="Outstanding" value={formatMoneySummary(totalOutstanding.toString())} />
        </KpiGrid>
        <p className="-mt-3 text-sm text-text-muted">{withDues} students with dues in this view</p>

        <form className="flex flex-wrap items-center gap-3" action="/finance/fee-payments">
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search by student name or admission no."
            className="min-w-64 flex-1 rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
          <select name="gradeId" defaultValue={gradeId ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Grade: All</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select name="dueStatus" defaultValue={dueStatus ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Due Status: All</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="NO_DEMAND">No demand</option>
          </select>
          <PlainButton type="submit" variant="secondary">Filter</PlainButton>
          <Link href="/finance/fee-payments" className="text-xs font-bold text-text-muted hover:text-text">Clear all</Link>
        </form>

        {students.length === 0 ? (
          <EmptyState title="No students match this filter" body="Try clearing search/grade/due status." />
        ) : (
          <DataTable
            getKey={(s) => s.id}
            rows={students}
            columns={[
              { header: "Student", render: (s) => <Link href={`/finance/students/${s.id}`} className="font-bold text-primary hover:underline">{s.displayName}</Link> },
              { header: "Admission No.", render: (s) => s.admissionNo },
              { header: "Grade / Section", render: (s) => [s.gradeName, s.sectionName].filter(Boolean).join(" / ") || "—" },
              { header: "Quota", render: (s) => s.communityCategory ?? "—" },
              { header: "Total Demand", align: "right", render: (s) => formatMoneySummary(s.totalDemandPaise) },
              { header: "Paid Amount", align: "right", render: (s) => formatMoneySummary(s.paidPaise) },
              { header: "Outstanding", align: "right", render: (s) => formatMoneySummary(s.outstandingPaise) },
              { header: "Due Status", render: (s) => <StatusPill state={s.dueStatus} /> },
              { header: "Last Payment", render: (s) => formatDate(s.lastPaymentAt) },
              {
                header: "Actions",
                render: (s) => (
                  <div className="flex justify-end gap-2">
                    {s.outstandingPaise !== "0" && (
                      <Link href={`/finance/students/${s.id}`}>
                        <PlainButton variant="primary" className="px-2.5 py-1 text-xs">Receive</PlainButton>
                      </Link>
                    )}
                    <Link href={`/finance/students/${s.id}`}>
                      <PlainButton variant="secondary" className="px-2.5 py-1 text-xs">View</PlainButton>
                    </Link>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load Fee Payments. Nothing was submitted — try again." />;
  }
}
