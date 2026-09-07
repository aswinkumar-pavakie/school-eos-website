import { redirect } from "next/navigation";
import { StatusPill } from "@/components/ui/StatusPill";
import { ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { formatDate, formatMoneyDetail } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getReconciliation } from "@/lib/finance-api";
import { closeReconciliationAction, deleteReconciliationAction, resolveEntryAction } from "../actions";
import { RunForm } from "./RunForm";

export default async function ReconciliationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { reconciliation, entries } = await getReconciliation(id);

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">{reconciliation.gateway}</h1>
            <p className="mt-1 text-sm text-text-muted">{formatDate(reconciliation.periodFrom)} – {formatDate(reconciliation.periodTo)}</p>
          </div>
          <StatusPill state={reconciliation.state} />
        </div>

        {(reconciliation.state === "DRAFT" || reconciliation.state === "NEEDS_REVIEW") && <RunForm id={id} />}

        {reconciliation.state === "DRAFT" && (
          <form action={deleteReconciliationAction.bind(null, id)}>
            <PlainButton variant="danger" type="submit">Delete</PlainButton>
          </form>
        )}

        {entries.length > 0 && (
          <section>
            <h2 className="text-xs font-bold tracking-wide text-text-muted uppercase">Entries</h2>
            <div className="mt-3 flex flex-col gap-2">
              {entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 text-sm">
                  <div>
                    <p className="font-mono text-text">{e.gatewayRef}</p>
                    <p className="font-mono font-bold text-text">{formatMoneyDetail(e.gatewayAmountPaise)}</p>
                    {e.discrepancyReason && <p className="text-xs text-critical-text">{e.discrepancyReason}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill state={e.matchState} />
                    {["UNMATCHED", "DISCREPANCY"].includes(e.matchState) && reconciliation.state === "NEEDS_REVIEW" && (
                      <form action={resolveEntryAction.bind(null, id, e.id)}>
                        <input type="hidden" name="resolutionNote" value="Reviewed and resolved by Finance" />
                        <PlainButton variant="secondary" type="submit" className="px-2.5 py-1 text-xs">Resolve</PlainButton>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {reconciliation.state === "NEEDS_REVIEW" && reconciliation.unmatchedCount === 0 && reconciliation.discrepancyCount === 0 && (
          <form action={closeReconciliationAction.bind(null, id)}>
            <PlainButton variant="primary" type="submit">Close period</PlainButton>
          </form>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this reconciliation. Nothing was submitted — try again." />;
  }
}
