import { redirect } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listStudentPayments } from "@/lib/finance-api";

export default async function StudentPaymentHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const payments = await listStudentPayments(id);

    if (payments.length === 0) {
      return <EmptyState title="No payments recorded" body="Payments received against this student will appear here." />;
    }

    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-text-muted">All payments recorded against this student.</p>
        <DataTable
          getKey={(p) => p.id}
          rows={payments}
          columns={[
            { header: "Date", render: (p) => formatDate(p.initiatedAt) },
            { header: "Mode", render: (p) => p.mode },
            { header: "Reference", render: (p) => p.gatewayRef ?? "—" },
            { header: "Amount", align: "right", render: (p) => formatMoneySummary(p.amountPaise) },
            { header: "Status", render: (p) => <StatusPill state={p.state} /> },
          ]}
        />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load payment history. Nothing was submitted — try again." />;
  }
}
