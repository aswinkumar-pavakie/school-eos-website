import Link from "next/link";
import { redirect } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { PlainButton } from "@/components/ui/Button";
import { formatMoneySummary, formatPercent } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listConcessions } from "@/lib/finance-api";
import { CreateConcessionModal } from "./CreateConcessionModal";
import { deleteConcessionAction } from "./actions";

// "Unsettled/Settled" mirrors the reference structure using our own real states:
// unsettled = still awaiting a decision (PENDING); settled = decided one way or
// another (APPROVED/REJECTED/CANCELLED) — there's no separate post-approval
// "apply to ledger" step in this schema, so a decision itself is the settlement.
export default async function ConcessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; tab?: string; studentSearch?: string }>;
}) {
  const { studentId, tab, studentSearch } = await searchParams;
  const activeTab = tab === "settled" ? "settled" : "unsettled";
  try {
    const { data: allConcessions } = await listConcessions({ studentSearch: studentSearch || undefined, pageSize: 500 });
    const unsettled = allConcessions.filter((c) => c.state === "PENDING");
    const settled = allConcessions.filter((c) => c.state !== "PENDING");
    const concessions = activeTab === "unsettled" ? unsettled : settled;

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Concessions</h1>
            <p className="mt-1 text-sm text-text-muted">Every concession routes through Finance, then Principal — no threshold bypass.</p>
          </div>
          <CreateConcessionModal defaultStudentId={studentId} defaultOpen={!!studentId} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Link href={`/finance/concessions?tab=unsettled${studentSearch ? `&studentSearch=${encodeURIComponent(studentSearch)}` : ""}`}>
              <PlainButton variant={activeTab === "unsettled" ? "primary" : "secondary"}>Unsettled {unsettled.length}</PlainButton>
            </Link>
            <Link href={`/finance/concessions?tab=settled${studentSearch ? `&studentSearch=${encodeURIComponent(studentSearch)}` : ""}`}>
              <PlainButton variant={activeTab === "settled" ? "primary" : "secondary"}>Settled {settled.length}</PlainButton>
            </Link>
          </div>
          <form action="/finance/concessions" className="flex items-center gap-2">
            <input type="hidden" name="tab" value={activeTab} />
            <input
              name="studentSearch"
              defaultValue={studentSearch ?? ""}
              placeholder="Search by student name or admission no."
              className="min-w-64 rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
            <PlainButton type="submit" variant="secondary">Search</PlainButton>
          </form>
        </div>

        {concessions.length === 0 ? (
          <EmptyState
            title={activeTab === "unsettled" ? "Nothing unsettled" : "Nothing settled yet"}
            body={activeTab === "unsettled" ? "Create one to start a Finance → Principal approval." : "Decided concessions will appear here."}
          />
        ) : (
          <DataTable
            getKey={(c) => c.id}
            rows={concessions}
            columns={[
              {
                header: "Student",
                render: (c) => (
                  <Link href={`/finance/students/${c.studentId}`} className="font-bold text-primary hover:underline">
                    {c.studentDisplayName ?? c.studentId.slice(0, 8)}
                    {c.studentAdmissionNo ? ` (${c.studentAdmissionNo})` : ""}
                  </Link>
                ),
              },
              { header: "Type", render: (c) => <Link href={`/finance/concessions/${c.id}`} className="font-bold text-primary hover:underline">{c.concessionType}</Link> },
              { header: "Value", align: "right", render: (c) => (c.percent ? formatPercent(c.percent) : formatMoneySummary(c.amountPaise ?? "0")) },
              { header: "Status", render: (c) => <StatusPill state={c.state} /> },
              {
                header: "",
                render: (c) => (
                  <div className="flex justify-end gap-2">
                    {c.approvalRequestId && (
                      <a href={`/finance/approvals/${c.approvalRequestId}`} className="text-xs font-bold text-primary hover:underline">Approval →</a>
                    )}
                    {c.state === "PENDING" && (
                      <form action={deleteConcessionAction.bind(null, c.id)}>
                        <PlainButton variant="danger" type="submit" className="px-2.5 py-1 text-xs">Cancel</PlainButton>
                      </form>
                    )}
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
    return <ErrorState message="Couldn't load concessions. Nothing was submitted — try again." />;
  }
}
