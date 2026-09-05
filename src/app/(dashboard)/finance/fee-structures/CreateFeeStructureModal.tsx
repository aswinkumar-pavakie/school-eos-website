"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlainButton, Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { AcademicYear, FeeHead, Grade, Medium } from "@/lib/finance-api";
import { createFeeStructureAction, type FormState } from "./actions";

const initial: FormState = {};

export function CreateFeeStructureModal({
  feeHeads,
  grades,
  academicYears,
  mediums,
}: {
  feeHeads: FeeHead[];
  grades: Grade[];
  academicYears: AcademicYear[];
  mediums: Medium[];
}) {
  const [state, formAction] = useActionState(createFeeStructureAction, initial);
  const [lineCount, setLineCount] = useState(1);

  return (
    <Modal title="Create fee structure" trigger={<PlainButton variant="primary">+ New fee structure</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Academic year" name="academicYearId" required defaultValue={academicYears.find((y) => y.isCurrent)?.id ?? ""}>
            <option value="" disabled>Select…</option>
            {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}{y.isCurrent ? " (current)" : ""}</option>)}
          </SelectField>
          <SelectField label="Grade" name="gradeId" required defaultValue="">
            <option value="" disabled>Select…</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </SelectField>
          <SelectField label="Medium (optional)" name="mediumId" defaultValue="">
            <option value="">—</option>
            {mediums.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </SelectField>
          <TextField label="Category (optional)" name="category" placeholder="e.g. General" />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Fee lines</p>
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <SelectField label="Fee head" name="lineFeeHeadId" required defaultValue="">
                <option value="" disabled>Select…</option>
                {feeHeads.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </SelectField>
              <TextField label="Amount (₹)" name="lineAmountRupees" type="number" min="0" step="0.01" required />
              <TextField label="Due date" name="lineDueDate" type="date" required />
            </div>
          ))}
          <button type="button" onClick={() => setLineCount((n) => n + 1)} className="self-start text-xs font-bold text-primary hover:underline">
            + Add another line
          </button>
        </div>

        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Creating…">Create fee structure</Button>
      </form>
    </Modal>
  );
}
