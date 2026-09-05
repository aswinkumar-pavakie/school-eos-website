"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { approveInlineAction, rejectInlineAction, type FormState } from "./approval-queue-actions";

const initial: FormState = {};

/** Details / Reject / Approve, directly in the approval-queue table row — Reject opens a small reason prompt (the backend requires one); Approve is a single click. */
export function InlineApproveReject({
  purchaseRequestId,
  approvalRequestId,
  revalidateTo,
}: {
  purchaseRequestId: string;
  approvalRequestId: string;
  revalidateTo: string;
}) {
  const [approveState, approveFormAction] = useActionState(approveInlineAction.bind(null, approvalRequestId, revalidateTo), initial);
  const [rejectState, rejectFormAction] = useActionState(rejectInlineAction.bind(null, approvalRequestId, revalidateTo), initial);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Link href={`/finance/purchase-requests/${purchaseRequestId}`}>
          <PlainButton type="button" variant="secondary">Details</PlainButton>
        </Link>
        <Modal title="Reject request" trigger={<PlainButton type="button" variant="secondary">Reject</PlainButton>}>
          <form action={rejectFormAction} className="flex flex-col gap-4">
            <TextAreaField label="Reason (required)" name="comment" rows={3} required />
            <FieldError message={rejectState.error} />
            <Button variant="danger" pendingLabel="Rejecting…">Reject</Button>
          </form>
        </Modal>
        <form action={approveFormAction}>
          <Button variant="primary" pendingLabel="Approving…">Approve</Button>
        </form>
      </div>
      <FieldError message={approveState.error} />
    </div>
  );
}
