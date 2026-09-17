import { PurchaseRequestDetailView } from "@/app/(dashboard)/finance/_shared/PurchaseRequestDetailView";

// Correspondent-shelled read-only view -- reached from "View underlying
// record" on /correspondent/requests/[id]. Same shared component
// Finance's/Principal's own purchase-requests/[id] uses; write actions
// (StageForms) never render here since a Correspondent caller is never
// FINANCE/ADMIN. Correspondent itself can raise a purchase/service request
// (POST /finance/purchase-requests already grants CORRESPONDENT) -- this
// detail view is currently only reached via the approvals inbox, same as
// Principal; no standalone "my requests" list/create page exists yet for
// either role (see query.md/Phase 6 report for this as a flagged, non-blocking
// gap rather than an invented new workflow).
export default async function CorrespondentPurchaseRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PurchaseRequestDetailView
      id={id}
      backHrefOverride="/correspondent/requests"
      backLabelOverride="Approvals"
      decideHrefBuilder={(approvalRequestId) => `/correspondent/requests/${approvalRequestId}`}
    />
  );
}
