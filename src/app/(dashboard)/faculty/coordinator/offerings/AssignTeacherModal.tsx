"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { CoordinatorOffering, EligibleFaculty } from "@/lib/faculty-coordinator-api";
import { assignTeacherAction, type FormState } from "../actions";

const initial: FormState = {};

export function AssignTeacherModal({ offering, faculty }: { offering: CoordinatorOffering; faculty: EligibleFaculty[] }) {
  const [state, formAction] = useActionState(assignTeacherAction.bind(null, offering.subjectOfferingId), initial);
  return (
    <Modal title="Assign teacher" trigger={<PlainButton variant="secondary">{offering.teacherName ? "Reassign" : "Assign"}</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">{offering.subjectName} · {offering.gradeName} {offering.sectionName}</p>
        <SelectField label="Teacher" name="teacherStaffId" required defaultValue="">
          <option value="" disabled>Select…</option>
          {faculty.map((f) => <option key={f.staffId} value={f.staffId}>{f.name}{f.designation ? ` · ${f.designation}` : ""}</option>)}
        </SelectField>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">Assign</Button>
      </form>
    </Modal>
  );
}
