"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { rejectAction, type FormState } from "./actions";

const initial: FormState = {};

// Reject always demands a reason (design system component #23) -- approve
// never does, so only reject gets a modal here.
export function RejectModal({ approvalRequestId }: { approvalRequestId: string }) {
  const [state, formAction] = useActionState(rejectAction.bind(null, approvalRequestId), initial);
  return (
    <Modal title="Reject leave request" trigger={<PlainButton variant="danger" type="button">Reject</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextAreaField label="Reason" name="comment" rows={3} placeholder="Why is this being rejected?" required />
        <FieldError message={state.error} />
        <Button variant="danger" pendingLabel="Rejecting…">Reject request</Button>
      </form>
    </Modal>
  );
}
