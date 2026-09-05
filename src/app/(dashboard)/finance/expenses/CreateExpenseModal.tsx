"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlainButton, Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { ExpenseCategory } from "@/lib/finance-api";
import { createExpenseAction, type FormState } from "./actions";

const initial: FormState = {};

export function CreateExpenseModal({ categories }: { categories: ExpenseCategory[] }) {
  const [state, formAction] = useActionState(createExpenseAction, initial);
  return (
    <Modal title="Record expense" trigger={<PlainButton variant="primary">+ Record expense</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <SelectField label="Category" name="categoryId" required defaultValue="">
          <option value="" disabled>Select…</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectField>
        <TextField label="Amount (₹)" name="amountRupees" type="number" min="0" step="0.01" required />
        <TextField label="Incurred on" name="incurredOn" type="date" required />
        <TextField label="Vendor (optional)" name="vendorName" />
        <TextAreaField label="Description (optional)" name="description" rows={2} />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Recording…">Record expense</Button>
      </form>
    </Modal>
  );
}
