import { ExpenseDetailView } from "@/app/(dashboard)/finance/_shared/ExpenseDetailView";

// Principal-shelled read-only view -- reached from "View underlying record" on
// /principal/requests/[id]. Same shared component Finance's own
// /finance/expenses/[id] uses; write actions never render for Principal since
// it's never FINANCE/ADMIN.
export default async function PrincipalExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ExpenseDetailView
      id={id}
      backHrefOverride="/principal/requests"
      backLabelOverride="Approvals"
      decideHrefBuilder={(approvalRequestId) => `/principal/requests/${approvalRequestId}`}
    />
  );
}
