"use client";

import { useActionState, useRef, useState } from "react";
import { PlainButton } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { formatMoneySummary } from "@/lib/format";
import type { StudentFeeAssignment } from "@/lib/finance-api";
import { confirmImportJobAction, validateImportJobAction, type FormState } from "../actions";

const initial: FormState = {};

// No object-storage/file-parsing service exists yet — rows are entered inline and the
// exact same set must be resubmitted to confirm as was validated (see Finance README).
// The row itself is a real dropdown of active fee assignments (student name +
// admission no. + net amount owed), never a raw assignment/student UUID typed from
// memory — one assignment IS one student, so picking it carries both ids at once.
export function RowsForm({
  id,
  canConfirm,
  assignments,
}: {
  id: string;
  canConfirm: boolean;
  assignments: StudentFeeAssignment[];
}) {
  const [validateState, validateAction] = useActionState(validateImportJobAction.bind(null, id), initial);
  const [confirmState, confirmAction] = useActionState(confirmImportJobAction.bind(null, id), initial);
  const [rowKeys, setRowKeys] = useState<number[]>([0]);
  const nextKey = useRef(1);

  function addRow() {
    setRowKeys((keys) => [...keys, nextKey.current++]);
  }
  function removeRow(key: number) {
    setRowKeys((keys) => (keys.length > 1 ? keys.filter((k) => k !== key) : keys));
  }

  const rowInputs = (
    <div className="flex flex-col gap-3">
      {rowKeys.map((key) => (
        <div key={key} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-end gap-2">
          <SelectField label="Student" name="assignmentAndStudent" required defaultValue="">
            <option value="" disabled>Select…</option>
            {assignments.map((a) => (
              <option key={a.id} value={`${a.id}|${a.studentId}`}>
                {a.studentDisplayName ?? a.studentId.slice(0, 8)}
                {a.studentAdmissionNo ? ` (${a.studentAdmissionNo})` : ""} — owes {formatMoneySummary(a.netPaise)}
              </option>
            ))}
          </SelectField>
          <TextField label="Instalment" name="instalmentNo" type="number" min="1" defaultValue="1" />
          <TextField label="Amount (₹)" name="amountRupees" type="number" min="0" step="0.01" />
          <TextField label="Due date" name="dueDate" type="date" />
          <button
            type="button"
            onClick={() => removeRow(key)}
            disabled={rowKeys.length === 1}
            aria-label="Remove this row"
            className="rounded-[var(--radius-input)] border border-border px-3 py-2.5 text-sm font-bold text-critical-text hover:bg-critical-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={addRow} className="self-start text-xs font-bold text-primary hover:underline">
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
