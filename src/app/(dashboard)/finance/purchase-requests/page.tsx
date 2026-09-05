import { redirect } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { listDepartments, listPurchaseRequests } from "@/lib/finance-api";
import { CreateRequestModal } from "./CreateRequestModal";

// Principal raises a Purchase Request (goods) / Service Request here — it goes
// directly, securely, to Finance for a decision (generic approvals engine, single
// FINANCE step — see 0004_purchase_requests.sql). Finance/Admin see every request;
// Principal sees only their own (backend-enforced in PurchaseRequestsService.list —
// this page never relies on hiding rows client-side for that boundary). Finance's own
// day-to-day queue lives at /finance/pop-approval and /finance/sop-approval instead —
// this combined page stays as Principal's "my requests" home and as a direct-link
// destination from those pages' "Details" buttons.
export default async function PurchaseRequestsPage() {
  try {
    const [{ data: requests }, actor, departments] = await Promise.all([
      listPurchaseRequests(),
      getCurrentActor(),
      listDepartments(),
    ]);
    const isPrincipal = actor.roles.includes("PRINCIPAL");
    const isFinanceOrAdmin = actor.roles.includes("FINANCE") || actor.roles.includes("ADMIN");

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Purchase &amp; Service Requests</h1>
            <p className="mt-1 text-sm text-text-muted">
              {isPrincipal
                ? "Raise a request — it routes securely to Finance for approval, then tracks through to delivery."
                : "Requests raised by the Principal, routed to you for approval and fulfillment tracking."}
            </p>
          </div>
          {isPrincipal && <CreateRequestModal departments={departments} />}
        </div>

        {requests.length === 0 ? (
          <EmptyState
            title="No requests yet"
            body={isPrincipal ? "Submit one to send it to Finance." : "Nothing has been raised yet."}
          />
        ) : (
          <DataTable
            getKey={(r) => r.id}
            rows={requests}
            columns={[
              {
                header: "Reference",
                render: (r) => (
                  <Link href={`/finance/purchase-requests/${r.id}`} className="font-bold text-primary hover:underline">
                    {r.referenceNo}
                  </Link>
                ),
              },
              { header: "Type", render: (r) => (r.requestType === "GOODS" ? "Purchase" : "Service") },
              { header: "Item", render: (r) => r.itemName },
              { header: "Department", render: (r) => r.departmentName ?? "—" },
              ...(isFinanceOrAdmin
                ? [{ header: "Requested by", render: (r: (typeof requests)[number]) => r.requestedByName ?? "—" }]
                : []),
              { header: "Needed by", render: (r) => formatDate(r.neededBy) },
              { header: "Est. amount", align: "right" as const, render: (r) => (r.estimatedAmountPaise ? formatMoneySummary(r.estimatedAmountPaise) : "—") },
              { header: "Status", render: (r) => <StatusPill state={r.state} /> },
            ]}
          />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load requests. Nothing was submitted — try again." />;
  }
}
