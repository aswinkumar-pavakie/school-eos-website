import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { formatDate, formatMoneyDetail } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getFeeStructure } from "@/lib/finance-api";
import { activateFeeStructureAction, deactivateFeeStructureAction, deleteFeeStructureAction } from "../actions";
import { ApprovalStatusPanel } from "../../_shared/ApprovalStatusPanel";

export default async function FeeStructureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { structure, lines } = await getFeeStructure(id);

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link href="/finance/fee-structures" className="text-xs font-bold text-text-muted hover:text-text">
          ← Back to Fee Structures
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">{structure.category ?? "Fee structure"}</h1>
            <p className="mt-1 text-sm text-text-muted">
              {structure.gradeName ?? "—"} · {structure.academicYearName ?? "—"}
            </p>
          </div>
          <StatusPill state={structure.state} />
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
          <p className="text-sm text-text">Total: <span className="font-mono font-bold">{formatMoneyDetail(structure.totalPaise)}</span></p>
        </div>

        {structure.approvalRequestId && <ApprovalStatusPanel approvalRequestId={structure.approvalRequestId} />}

        <section>
          <h2 className="text-xs font-bold tracking-wide text-text-muted uppercase">Fee lines</h2>
          <div className="mt-3 flex flex-col gap-2">
            {lines.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 text-sm">
                <span className="text-text">{l.feeHeadName ?? "Fee"} · Instalment {l.instalmentNo} · due {formatDate(l.dueDate)}</span>
                <span className="font-mono font-bold text-text">{formatMoneyDetail(l.amountPaise)}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex gap-3">
          {structure.state === "DRAFT" && (
            <>
              <form action={activateFeeStructureAction.bind(null, id)}>
                <PlainButton variant="primary" type="submit">Submit for activation</PlainButton>
              </form>
              <form action={deleteFeeStructureAction.bind(null, id)}>
                <PlainButton variant="danger" type="submit">Delete</PlainButton>
              </form>
            </>
          )}
          {structure.state === "ACTIVE" && (
            <form action={deactivateFeeStructureAction.bind(null, id)}>
              <PlainButton variant="secondary" type="submit">Supersede</PlainButton>
            </form>
          )}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this fee structure. Nothing was submitted — try again." />;
  }
}
