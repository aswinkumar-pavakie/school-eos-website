import { ApprovalQueueView } from "../_shared/ApprovalQueueView";

export default async function PopApprovalPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; departmentId?: string }>;
}) {
  const { q, status, departmentId } = await searchParams;
  return (
    <ApprovalQueueView
      requestType="GOODS"
      label="POP"
      basePath="/finance/pop-approval"
      status={status ?? "PENDING"}
      departmentId={departmentId}
      search={q}
    />
  );
}
