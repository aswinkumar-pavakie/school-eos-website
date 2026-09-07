"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { approveAction, rejectAction, sendBackAction, withdrawAction, type DecisionState } from "./actions";

const initial: DecisionState = {};

// Component #23 — Approval action, extended with a third option: Approve / Reject /
// Send Back. Reject and Send Back both always demand a reason; Approve's comment
// stays optional. Principal is deciding whether to let this proceed, not performing
// the underlying purchase/service operation itself -- Send Back returns the request
// to the requester for revision, it does not execute anything downstream.
export function DecisionForms({ id, canDecide, isRequester }: { id: string; canDecide: boolean; isRequester: boolean }) {
  const [approveState, approveFormAction] = useActionState(approveAction.bind(null, id), initial);
  const [rejectState, rejectFormAction] = useActionState(rejectAction.bind(null, id), initial);
  const [sendBackState, sendBackFormAction] = useActionState(sendBackAction.bind(null, id), initial);

  return (
    <div className="flex flex-col gap-6">
      {canDecide && (
        <div className="grid gap-4 sm:grid-cols-3">
          <form action={approveFormAction} className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Approve</p>
            <TextAreaField label="Comment (optional)" name="comment" rows={2} />
            <FieldError message={approveState.error} />
            <Button variant="primary" pendingLabel="Approving…">Approve</Button>
          </form>

          <form action={sendBackFormAction} className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Send Back</p>
            <TextAreaField label="Reason/comment (required)" name="comment" rows={2} required />
            <FieldError message={sendBackState.error} />
            <Button variant="secondary" pendingLabel="Sending back…">Send Back</Button>
          </form>

          <form action={rejectFormAction} className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
            <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Reject</p>
            <TextAreaField label="Reason (required)" name="comment" rows={2} required />
            <FieldError message={rejectState.error} />
            <Button variant="danger" pendingLabel="Rejecting…">Reject</Button>
          </form>
        </div>
      )}

      {isRequester && (
        <form action={withdrawAction.bind(null, id)}>
          <Button variant="secondary" pendingLabel="Withdrawing…">Withdraw request</Button>
        </form>
      )}
    </div>
  );
}
