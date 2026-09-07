import { FeeStructureDetailView } from "@/app/(dashboard)/finance/_shared/FeeStructureDetailView";

// Principal-shelled read-only view -- reached from "View underlying record" on
// /principal/requests/[id]. Same shared component Finance's own
// /finance/fee-structures/[id] uses; write actions never render for Principal
// since it's never FINANCE/ADMIN.
export default async function PrincipalFeeStructureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FeeStructureDetailView
      id={id}
      backHrefOverride="/principal/requests"
      backLabelOverride="Approvals"
      decideHrefBuilder={(approvalRequestId) => `/principal/requests/${approvalRequestId}`}
    />
  );
}
