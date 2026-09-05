"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlainButton, Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { createRefundAction, type FormState } from "../actions";

const initial: FormState = {};

export function CreateRefundModal({ paymentId }: { paymentId: string }) {
  const [state, formAction] = useActionState(createRefundAction.bind(null, paymentId), initial);
  return (
    <Modal title="Request refund" trigger={<PlainButton>+ Refund</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Student ID" name="studentId" required placeholder="uuid" />
        <TextField label="Amount (₹)" name="amountRupees" type="number" min="0" step="0.01" required />
        <TextAreaField label="Reason" name="reason" required rows={3} />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Requesting…">Request refund</Button>
      </form>
    </Modal>
  );
}
