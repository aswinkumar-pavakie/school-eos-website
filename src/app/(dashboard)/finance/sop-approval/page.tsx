import { ApprovalQueueView } from "../_shared/ApprovalQueueView";

export default async function SopApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; departmentId?: string }>;
}) {
  const { q, status, departmentId } = await searchParams;
  return (
    <ApprovalQueueView
      requestType="SERVICE"
      label="SOP"
      basePath="/finance/sop-approval"
      status={status ?? "PENDING"}
      departmentId={departmentId}
      search={q}
    />
  );
}
