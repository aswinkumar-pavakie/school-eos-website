"use client";

import { useActionState, useState } from "react";
import { PlainButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { confirmImportJobAction, validateImportJobAction, type FormState } from "../actions";

const initial: FormState = {};

// No object-storage/file-parsing service exists yet — rows are entered inline and the
// exact same set must be resubmitted to confirm as was validated (see Finance README).
export function RowsForm({ id, canConfirm }: { id: string; canConfirm: boolean }) {
  const [validateState, validateAction] = useActionState(validateImportJobAction.bind(null, id), initial);
  const [confirmState, confirmAction] = useActionState(confirmImportJobAction.bind(null, id), initial);
  const [rows, setRows] = useState(1);

  const rowInputs = (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-5 gap-2">
          <TextField label="Assignment ID" name="assignmentId" />
          <TextField label="Student ID" name="studentId" />
          <TextField label="Instalment" name="instalmentNo" type="number" min="1" defaultValue="1" />
          <TextField label="Amount (₹)" name="amountRupees" type="number" min="0" step="0.01" />
          <TextField label="Due date" name="dueDate" type="date" />
        </div>
      ))}
      <button type="button" onClick={() => setRows((n) => n + 1)} className="self-start text-xs font-bold text-primary hover:underline">
        + Add another row
      </button>
    </div>
  );

  return (
    <form className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Rows</p>
      {rowInputs}
      <FieldError message={validateState.error ?? confirmState.error} />
      <div className="flex gap-3">
        <PlainButton type="submit" formAction={validateAction} variant="secondary">Validate</PlainButton>
        {canConfirm && <PlainButton type="submit" formAction={confirmAction} variant="primary">Confirm (commit)</PlainButton>}
      </div>
    </form>
  );
}
