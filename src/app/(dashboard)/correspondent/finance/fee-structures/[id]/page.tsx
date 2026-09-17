import { FeeStructureDetailView } from "@/app/(dashboard)/finance/_shared/FeeStructureDetailView";

// Correspondent-shelled read-only view -- reached from "View underlying
// record" on /correspondent/requests/[id]. Same shared component
// Finance's/Principal's own fee-structures/[id] uses; write actions never
// render for Correspondent since it's never FINANCE/ADMIN.
export default async function CorrespondentFeeStructureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FeeStructureDetailView
      id={id}
      backHrefOverride="/correspondent/requests"
      backLabelOverride="Approvals"
      decideHrefBuilder={(approvalRequestId) => `/correspondent/requests/${approvalRequestId}`}
    />
  );
}
