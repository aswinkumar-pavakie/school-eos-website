import { redirect } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listObligations } from "@/lib/finance-api";
import { ObligationRowActions } from "../../../obligations/RowActions";

export default async function StudentDemandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { data: obligations } = await listObligations({ studentId: id, pageSize: 100 });

    if (obligations.length === 0) {
      return <EmptyState title="No obligations for this student" body="Nothing has been demanded against this student yet." />;
    }

    return (
      <DataTable
        getKey={(o) => o.id}
        rows={obligations}
        columns={[
          { header: "Instalment", render: (o) => o.instalmentNo },
          { header: "Due", render: (o) => formatDate(o.dueDate) },
          { header: "Amount", align: "right", render: (o) => formatMoneySummary(o.amountPaise) },
          { header: "Paid", align: "right", render: (o) => formatMoneySummary(o.paidPaise) },
          { header: "Status", render: (o) => <StatusPill state={o.state} /> },
          { header: "", render: (o) => <ObligationRowActions obligation={o} /> },
        ]}
      />
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load demand details. Nothing was submitted — try again." />;
  }
}
