"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlainButton, Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { createReconciliationAction, type FormState } from "./actions";

const initial: FormState = {};

export function CreateReconciliationModal() {
  const [state, formAction] = useActionState(createReconciliationAction, initial);
  return (
    <Modal title="Create reconciliation" trigger={<PlainButton variant="primary">+ New reconciliation</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Gateway" name="gateway" required placeholder="e.g. RAZORPAY" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Period from" name="periodFrom" type="date" required />
          <TextField label="Period to" name="periodTo" type="date" required />
        </div>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Creating…">Create</Button>
      </form>
    </Modal>
  );
}
