import { ConcessionDetailView } from "@/app/(dashboard)/finance/_shared/ConcessionDetailView";

// Correspondent-shelled read-only view -- reached from "View underlying
// record" on /correspondent/requests/[id]. Same shared component
// Finance's/Principal's own concessions/[id] uses; write actions never render
// for Correspondent since it's never FINANCE/ADMIN.
export default async function CorrespondentConcessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ConcessionDetailView
      id={id}
      backHrefOverride="/correspondent/requests"
      backLabelOverride="Approvals"
      decideHrefBuilder={(approvalRequestId) => `/correspondent/requests/${approvalRequestId}`}
    />
  );
}
