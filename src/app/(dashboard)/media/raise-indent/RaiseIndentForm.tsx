"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { createMediaIndentAction, type FormState } from "./actions";

const initial: FormState = {};

export function RaiseIndentForm() {
  const [state, formAction] = useActionState(createMediaIndentAction, initial);
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
      <h2 className="mb-1 text-sm font-bold text-text">Indent details</h2>
      <p className="mb-4 text-xs text-text-muted">Route: Media Room Head → Principal</p>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Title" name="itemName" required placeholder="e.g. Two mirrorless bodies for event coverage" />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Category" name="requestType" defaultValue="GOODS">
            <option value="GOODS">Capital equipment (goods)</option>
            <option value="SERVICE">Service</option>
          </SelectField>
          <TextField label="Quantity" name="quantity" type="number" min="1" defaultValue="1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Estimated cost (₹)" name="estimatedCostRupees" placeholder="e.g. 180000" />
          <TextField label="Date needed" name="neededBy" type="date" />
        </div>
        <TextAreaField label="Justification" name="description" rows={3} placeholder="Why the media room needs this, current gear shortfall, events affected." />
        <FieldError message={state.error} />
        <div className="flex justify-end">
          <Button variant="primary" pendingLabel="Submitting…">Submit indent</Button>
        </div>
      </form>
    </div>
  );
}
