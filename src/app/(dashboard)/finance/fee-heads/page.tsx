import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { PlainButton } from "@/components/ui/Button";
import { AuthExpiredError } from "@/lib/api";
import { listFeeHeads } from "@/lib/finance-api";
import { CreateFeeHeadModal } from "./CreateFeeHeadModal";
import { EditFeeHeadModal } from "./EditFeeHeadModal";
import { activateFeeHeadAction, deactivateFeeHeadAction } from "./actions";

export default async function FeeHeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const { search, status } = await searchParams;
  try {
    const allFeeHeads = await listFeeHeads();
    const q = search?.trim().toLowerCase();
    const feeHeads = allFeeHeads.filter((h) => {
      if (status && h.status !== status) return false;
      if (q && !h.name.toLowerCase().includes(q) && !h.code.toLowerCase().includes(q)) return false;
      return true;
    });

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Fee Structure Items</h1>
            <p className="mt-1 text-sm text-text-muted">The reusable fee heads a Fee Structure's lines are built from (e.g. Tuition, Transport, Hostel).</p>
          </div>
          <CreateFeeHeadModal />
        </div>

        <form action="/finance/fee-heads" className="flex flex-wrap items-center gap-3">
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search by name or code"
            className="min-w-64 flex-1 rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
          <select name="status" defaultValue={status ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">Status: All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <PlainButton type="submit" variant="secondary">Filter</PlainButton>
          <Link href="/finance/fee-heads" className="text-xs font-bold text-text-muted hover:text-text">Clear</Link>
        </form>

        {feeHeads.length === 0 ? (
          <EmptyState title="No fee structure items match this filter" body="Try clearing search/status, or add one." />
        ) : (
          <DataTable
            getKey={(h) => h.id}
            rows={feeHeads}
            columns={[
              { header: "Name", render: (h) => h.name },
              { header: "Code", render: (h) => h.code },
              { header: "Type", render: (h) => h.headType },
              { header: "Refundable", render: (h) => (h.isRefundable ? "Yes" : "No") },
              { header: "Status", render: (h) => <StatusPill state={h.status} /> },
              {
                header: "",
                render: (h) => (
                  <div className="flex justify-end gap-2">
                    <EditFeeHeadModal feeHead={h} />
                    <form action={(h.status === "ACTIVE" ? deactivateFeeHeadAction : activateFeeHeadAction).bind(null, h.id)}>
                      <PlainButton variant="secondary" type="submit" className="px-2.5 py-1 text-xs">
                        {h.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </PlainButton>
                    </form>
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
    return <ErrorState message="Couldn't load fee structure items. Nothing was submitted — try again." />;
  }
}
