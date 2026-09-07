"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { Expense } from "@/lib/finance-api";
import { updateExpenseAction, type FormState } from "../actions";

const initial: FormState = {};

export function EditForm({ expense }: { expense: Expense }) {
  const [state, formAction] = useActionState(updateExpenseAction.bind(null, expense.id), initial);
  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <TextField label="Amount (₹)" name="amountRupees" type="number" min="0" step="0.01" defaultValue={(Number(expense.amountPaise) / 100).toString()} required />
      <TextField label="Incurred on" name="incurredOn" type="date" defaultValue={expense.incurredOn.slice(0, 10)} required />
      <TextField label="Vendor" name="vendorName" defaultValue={expense.vendorName ?? ""} />
      <TextAreaField label="Description" name="description" defaultValue={expense.description ?? ""} rows={2} />
      <FieldError message={state.error} />
      <Button variant="secondary" pendingLabel="Saving…" className="self-start">Save changes</Button>
    </form>
  );
}
