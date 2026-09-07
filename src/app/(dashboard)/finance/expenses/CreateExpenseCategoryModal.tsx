"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlainButton, Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { createExpenseCategoryAction, type FormState } from "./actions-master-data";

const initial: FormState = {};

export function CreateExpenseCategoryModal() {
  const [state, formAction] = useActionState(createExpenseCategoryAction, initial);
  return (
    <Modal title="Create expense category" trigger={<PlainButton>+ Category</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Name" name="name" required placeholder="e.g. Transport Maintenance" />
        <TextField label="Code (optional)" name="code" placeholder="e.g. TRANSPORT_MAINT" />
        <TextField label="Petty-cash limit (₹)" name="pettyLimitRupees" type="number" min="0" step="0.01" defaultValue="5000" />
        <p className="text-xs text-text-muted">At/below this limit, Finance's own submission clears an expense immediately. Above it, Principal must approve.</p>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Creating…">Create</Button>
      </form>
    </Modal>
  );
}
