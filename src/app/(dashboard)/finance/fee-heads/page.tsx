import { redirect } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { PlainButton } from "@/components/ui/Button";
import { AuthExpiredError } from "@/lib/api";
import { listFeeHeads } from "@/lib/finance-api";
import { CreateFeeHeadModal } from "./CreateFeeHeadModal";
import { activateFeeHeadAction, deactivateFeeHeadAction } from "./actions";

export default async function FeeHeadsPage() {
  try {
    const feeHeads = await listFeeHeads();

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Fee Structure Items</h1>
            <p className="mt-1 text-sm text-text-muted">The reusable fee heads a Fee Structure's lines are built from (e.g. Tuition, Transport, Hostel).</p>
          </div>
          <CreateFeeHeadModal />
        </div>

        {feeHeads.length === 0 ? (
          <EmptyState title="No fee structure items yet" body="Add one before creating a fee structure." />
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
                  <form action={(h.status === "ACTIVE" ? deactivateFeeHeadAction : activateFeeHeadAction).bind(null, h.id)}>
                    <PlainButton variant="secondary" type="submit" className="px-2.5 py-1 text-xs">
                      {h.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </PlainButton>
                  </form>
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
