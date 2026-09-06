// Finance's own Library-fines view -- reads the SAME /library/fines list Library's
// own fines page reads (never a second copy of this data), plus the misc-receivables
// this module's routed to Finance (sourceModule=LIBRARY). The one real action here
// is "Collect payment" against an already-sent-to-Finance fine's receivable -- no
// send-to-finance/waive here, those stay Library's own operational actions.

import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { listFines, type LibraryFine } from "@/lib/library-api";
import { listMiscReceivables, type MiscReceivable } from "@/lib/finance-api";
import { CollectPaymentModal } from "./CollectPaymentModal";

const STATUS_OPTIONS = ["PENDING", "SENT_TO_FINANCE", "PAID", "WAIVED", "CANCELLED"];

export default async function FinanceLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  try {
    const [{ data: fines }, { data: receivables }] = await Promise.all([
      listFines({ status: status || undefined, page: 1, limit: 200 }),
      listMiscReceivables({ sourceModule: "LIBRARY", pageSize: 200 }),
    ]);

    const receivableById = new Map<string, MiscReceivable>(receivables.map((r) => [r.id, r]));

    function balancePaiseFor(receivable: MiscReceivable): string {
      return String(BigInt(receivable.amountPaise) - BigInt(receivable.paidPaise));
    }

    function actionsFor(fine: LibraryFine) {
      if (!fine.financeReceivableId) return <span className="text-xs text-text-muted">—</span>;
      const receivable = receivableById.get(fine.financeReceivableId);
      if (!receivable || !["PENDING", "PARTIAL"].includes(receivable.status)) {
        return <span className="text-xs text-text-muted">—</span>;
      }
      return <CollectPaymentModal receivableId={receivable.id} balancePaise={balancePaiseFor(receivable)} />;
    }

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Library</h1>
          <p className="mt-1 text-sm text-text-muted">
            Read-only view of Library fines. Collect payment once a fine reaches Finance -- sending a fine here and waiving it stay Library's own actions.
          </p>
        </div>

        <form action="/finance/library" className="flex flex-wrap items-center gap-3">
          <select name="status" defaultValue={status ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Status: All</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" className="rounded-[var(--radius-input)] border border-border bg-surface px-4 py-2.5 text-sm font-bold text-text hover:bg-field">
            Filter
          </button>
          <Link href="/finance/library" className="text-xs font-bold text-text-muted hover:text-text">Clear</Link>
        </form>

        {fines.length === 0 ? (
          <EmptyState title="No Library fines match this view" body="Fines are assessed automatically by the Library module for overdue, lost, or damaged books." />
        ) : (
          <DataTable
            getKey={(f) => f.id}
            rows={fines}
            columns={[
              { header: "Member", render: (f) => <span className="font-bold text-text">{f.memberName}</span> },
              { header: "Reason", render: (f) => f.reason },
              { header: "Assessed", render: (f) => formatDate(f.assessedAt) },
              { header: "Amount", align: "right", render: (f) => formatMoneySummary(f.amountPaise) },
              { header: "Status", render: (f) => <StatusPill state={f.status} /> },
              { header: "", render: (f) => <div className="flex justify-end">{actionsFor(f)}</div> },
            ]}
          />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load Library fines. Nothing was submitted — try again." />;
  }
}
