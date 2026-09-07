import { ConcessionDetailView } from "@/app/(dashboard)/finance/_shared/ConcessionDetailView";

// Principal-shelled read-only view -- reached from "View underlying record" on
// /principal/requests/[id]. Same shared component Finance's own
// /finance/concessions/[id] uses; write actions never render for Principal since
// it's never FINANCE/ADMIN.
export default async function PrincipalConcessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ConcessionDetailView
      id={id}
      backHrefOverride="/principal/requests"
      backLabelOverride="Approvals"
      decideHrefBuilder={(approvalRequestId) => `/principal/requests/${approvalRequestId}`}
    />
  );
}
