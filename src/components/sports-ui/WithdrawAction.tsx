"use client";

import { DeleteButton } from "./DeleteButton";
import { withdrawSportsApprovalRequestAction } from "./withdraw-action";

// Shared "Delete" for every Sports Admin screen whose request goes through
// the generic approvals engine (OD requests, Indents, Budget requests) --
// there is no edit or hard-delete on the domain row itself by design (same
// convention Finance's own PurchaseRequestsController never lets you
// rewrite a submitted request), but the requester can withdraw their own
// still-open request via the real, already-existing POST
// /approvals/:id/withdraw endpoint.
export function WithdrawAction({
  approvalRequestId,
  state,
  isRequester,
  label,
  revalidatePath,
}: {
  approvalRequestId: string | null;
  state: string;
  isRequester: boolean;
  label: string;
  revalidatePath: string;
}) {
  if (!approvalRequestId || state !== "PENDING" || !isRequester) return null;

  return (
    <DeleteButton
      label="Withdraw"
      confirmMessage={`Withdraw this ${label}? This cannot be undone.`}
      action={() => withdrawSportsApprovalRequestAction(approvalRequestId, revalidatePath)}
      successMessage="Withdrawn."
    />
  );
}
