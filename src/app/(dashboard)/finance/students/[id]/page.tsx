import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { formatDate, formatMoneyDetail } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getStudent, listFeeHeads, listObligations, listStudentPayments } from "@/lib/finance-api";
import { ReceivePaymentModal, type DemandOption } from "./ReceivePaymentModal";

export default async function StudentReceivePaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [student, { data: obligations }, feeHeads, payments] = await Promise.all([
      getStudent(id),
      listObligations({ studentId: id, pageSize: 100 }),
      listFeeHeads(),
      listStudentPayments(id),
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
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <h2 className="text-base font-extrabold text-text">Payment Summary</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <div>
              <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Paid Amount</p>
              <p className="mt-1 font-mono font-bold text-text">{formatMoneyDetail(student.paidPaise)}</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Outstanding Amount</p>
              <p className="mt-1 font-mono font-bold text-text">{formatMoneyDetail(student.outstandingPaise)}</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Last Payment</p>
              <p className="mt-1 text-text">{formatDate(student.lastPaymentAt)}</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Payments on record</p>
              <p className="mt-1 text-text">{payments.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
          <h2 className="text-base font-extrabold text-text">Quick Actions</h2>
          <div className="mt-4 flex flex-col gap-2">
            {demandOptions.length > 0 ? (
              <ReceivePaymentModal
                studentId={id}
                demandOptions={demandOptions}
                trigger={<PlainButton variant="primary" className="w-full justify-start">+ Receive Payment</PlainButton>}
              />
            ) : (
              <p className="text-xs text-text-muted">No outstanding obligations to receive against.</p>
            )}
            <Link href={`/finance/students/${id}/history`}>
              <PlainButton variant="secondary" className="w-full justify-start">Print Receipt</PlainButton>
            </Link>
            <Link href={`/finance/concessions?studentId=${id}`}>
              <PlainButton variant="secondary" className="w-full justify-start">Apply Concession</PlainButton>
            </Link>
            {demandOptions.length > 0 && (
              <ReceivePaymentModal
                studentId={id}
                demandOptions={demandOptions}
                defaultMode="DD"
                trigger={<PlainButton variant="secondary" className="w-full justify-start">Add Education Loan DD</PlainButton>}
              />
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this student's payment summary. Nothing was submitted — try again." />;
  }
}
