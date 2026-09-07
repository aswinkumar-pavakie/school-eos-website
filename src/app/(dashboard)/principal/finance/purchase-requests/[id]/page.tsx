import { PurchaseRequestDetailView } from "@/app/(dashboard)/finance/_shared/PurchaseRequestDetailView";

// Principal-shelled read-only view of a Purchase/Service Request -- reached from
// "View underlying record" on /principal/requests/[id]. Same shared component
// Finance's own /finance/purchase-requests/[id] uses; write actions (StageForms)
// never render here since a Principal caller is never FINANCE/ADMIN. Only the
// back-link differs (Principal arrived from its own Approvals inbox, not Finance's
// tracking/approval queues).
export default async function PrincipalPurchaseRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PurchaseRequestDetailView
      id={id}
      backHrefOverride="/principal/requests"
      backLabelOverride="Approvals"
      decideHrefBuilder={(approvalRequestId) => `/principal/requests/${approvalRequestId}`}
    />
  );
}
