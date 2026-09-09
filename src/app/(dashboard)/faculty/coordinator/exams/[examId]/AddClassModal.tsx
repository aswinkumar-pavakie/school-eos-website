"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { CoordinatorOffering } from "@/lib/faculty-coordinator-api";
import { createExamSubjectAction, type FormState } from "../../actions";

const initial: FormState = {};

export function AddClassModal({ examId, offerings }: { examId: string; offerings: CoordinatorOffering[] }) {
  const [state, formAction] = useActionState(createExamSubjectAction.bind(null, examId), initial);
  return (
    <Modal title="Add a class to this exam" trigger={<PlainButton variant="primary">+ Add a class</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <SelectField label="Class" name="subjectOfferingId" required defaultValue="">
          <option value="" disabled>Select…</option>
          {offerings.map((o) => <option key={o.subjectOfferingId} value={o.subjectOfferingId}>{o.subjectName} · {o.gradeName} {o.sectionName}</option>)}
        </SelectField>
        <TextField label="Max marks" name="maxMarks" type="number" min="1" defaultValue={100} required />
        <TextField label="Pass marks (optional)" name="passMarks" type="number" min="0" />
        <TextField label="Exam date (optional)" name="examDate" type="date" />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Adding…">Add</Button>
      </form>
    </Modal>
  );
}
