import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listReconciliations } from "@/lib/finance-api";
import { CreateReconciliationModal } from "./CreateReconciliationModal";

export default async function ReconciliationsPage() {
  try {
    const { data: reconciliations } = await listReconciliations();

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Reconciliation</h1>
            <p className="mt-1 text-sm text-text-muted">Cross-check the gateway's settlement report against confirmed payments.</p>
          </div>
          <CreateReconciliationModal />
        </div>

        {reconciliations.length === 0 ? (
          <EmptyState title="No reconciliation runs yet" body="Create one for a gateway settlement period, then run it against the settlement rows." />
        ) : (
          <DataTable
            getKey={(r) => r.id}
            rows={reconciliations}
            columns={[
              { header: "Gateway", render: (r) => r.gateway },
              { header: "Period", render: (r) => `${formatDate(r.periodFrom)} – ${formatDate(r.periodTo)}` },
              { header: "Matched / Unmatched / Discrepancy", render: (r) => `${r.matchedCount} / ${r.unmatchedCount} / ${r.discrepancyCount}` },
              { header: "Status", render: (r) => <StatusPill state={r.state} /> },
              { header: "", render: (r) => <Link href={`/finance/payments/reconciliations/${r.id}`} className="text-xs font-bold text-primary hover:underline">View →</Link> },
            ]}
          />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load reconciliations. If migration 0003 hasn't been run yet, this is expected — see the Finance module README." />;
  }
}
