import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { PlainButton } from "@/components/ui/Button";
import { formatCount, formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listObligations } from "@/lib/finance-api";
import { CreateObligationModal } from "./CreateObligationModal";
import { ObligationRowActions } from "./RowActions";

export default async function ObligationsPage() {
  try {
    const { data: obligations } = await listObligations();

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Obligations</h1>
            <p className="mt-1 text-sm text-text-muted">What's owed, per student, per instalment.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/finance/obligations/imports"><PlainButton variant="secondary">Bulk import</PlainButton></Link>
            <CreateObligationModal />
          </div>
        </div>

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
