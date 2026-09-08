"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { CoordinatorGrade } from "@/lib/faculty-coordinator-api";
import { createExamAction, type FormState } from "../actions";

const initial: FormState = {};
const EXAM_TYPES = ["UNIT_TEST", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUAL", "MODEL", "REVISION", "PRACTICAL", "BOARD"];

export function CreateExamModal({ grades }: { grades: CoordinatorGrade[] }) {
  const [state, formAction] = useActionState(createExamAction, initial);
  return (
    <Modal title="New exam" trigger={<PlainButton variant="primary">+ New exam</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Name" name="name" placeholder="e.g. Half Yearly Examination" required />
        <SelectField label="Type" name="examType" defaultValue={EXAM_TYPES[0]}>
          {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </SelectField>
        <TextField label="Term (optional)" name="term" placeholder="e.g. Term 1" />
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">Grades</p>
          <div className="flex flex-col gap-1.5 rounded-[var(--radius-input)] border border-border p-2">
            {grades.map((g) => (
              <label key={g.gradeId} className="flex items-center gap-2 rounded-[var(--radius-input)] px-2 py-1.5 text-sm text-text hover:bg-field">
                <input type="checkbox" name="gradeIds" value={g.gradeId} defaultChecked className="h-4 w-4 rounded border-border" />
                {g.gradeName}
              </label>
            ))}
          </div>
        </div>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Creating…">Create exam</Button>
      </form>
    </Modal>
  );
}
