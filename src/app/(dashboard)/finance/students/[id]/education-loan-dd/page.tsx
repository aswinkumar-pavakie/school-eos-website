import { redirect } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatMoneyDetail, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listFeeHeads, listObligations, listStudentEducationLoanDDs } from "@/lib/finance-api";
import { ReceivePaymentModal, type DemandOption } from "../ReceivePaymentModal";
import { PlainButton } from "@/components/ui/Button";
import { clearDDAction } from "../actions";

export default async function StudentEducationLoanDDPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [dds, { data: obligations }, feeHeads] = await Promise.all([
      listStudentEducationLoanDDs(id),
      listObligations({ studentId: id, pageSize: 100 }),
      listFeeHeads(),
    ]);

    const feeHeadName = (feeHeadId: string | null) => feeHeads.find((h) => h.id === feeHeadId)?.name ?? "Fee";
    const demandOptions: DemandOption[] = obligations
      .map((o) => ({
        feeDemandId: o.id,
        balancePaise: (BigInt(o.amountPaise) + BigInt(o.lateFeePaise) - BigInt(o.paidPaise)).toString(),
        label: `${feeHeadName(o.feeHeadId)} — outstanding ${formatMoneyDetail((BigInt(o.amountPaise) + BigInt(o.lateFeePaise) - BigInt(o.paidPaise)).toString())}`,
      }))
      .filter((o) => o.balancePaise !== "0");

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">Education loan demand drafts recorded for this student.</p>
          {demandOptions.length > 0 && (
            <ReceivePaymentModal
              studentId={id}
              demandOptions={demandOptions}
              defaultMode="DD"
              trigger={<PlainButton variant="primary">+ Add DD</PlainButton>}
            />
          )}
        </div>
        {dds.length === 0 ? (
          <EmptyState title="No education loan DDs found" body="Add a DD to get started." />
        ) : (
          <DataTable
            getKey={(p) => p.id}
            rows={dds}
            columns={[
              { header: "DD Reference No.", render: (p) => p.gatewayRef ?? "—" },
              { header: "Bank", render: (p) => p.gateway ?? "—" },
              { header: "Amount", align: "right", render: (p) => formatMoneySummary(p.amountPaise) },
              { header: "Date", render: (p) => formatDate(p.initiatedAt) },
              { header: "Status", render: (p) => <StatusPill state={p.state} /> },
              {
                header: "",
                render: (p) =>
                  p.state === "PENDING" ? (
                    <form action={clearDDAction.bind(null, id, p.id)}>
                      <PlainButton variant="primary" type="submit" className="px-2.5 py-1 text-xs">Mark cleared</PlainButton>
                    </form>
                  ) : null,
              },
            ]}
          />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load education loan DDs. Nothing was submitted — try again." />;
  }
}
