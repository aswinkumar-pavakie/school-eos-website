"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { StudentDuty } from "@/lib/faculty-api";
import { StudentPicker } from "./StudentPicker";
import { createDutyAction, updateDutyAction, type FormState } from "./actions";

const initial: FormState = {};

export function DutyModal({ sectionId, duty }: { sectionId: string; duty?: StudentDuty }) {
  const action = duty ? updateDutyAction.bind(null, duty.id) : createDutyAction.bind(null, sectionId);
  const [state, formAction] = useActionState(action, initial);
  const [studentId, setStudentId] = useState<string | null>(duty?.studentId ?? null);

  return (
    <Modal
      title={duty ? "Edit class officer" : "Assign class officer"}
      trigger={<PlainButton variant={duty ? "secondary" : "primary"}>{duty ? "Edit" : "+ Assign officer"}</PlainButton>}
    >
      <form action={formAction} className="flex flex-col gap-4">
        {duty ? (
          <p className="text-sm text-text">{duty.studentName} <span className="text-text-muted">· Roll {duty.rollNo ?? "—"}</span></p>
        ) : (
          <StudentPicker sectionId={sectionId} onSelect={(s) => setStudentId(s?.studentId ?? null)} />
        )}
        <TextField label="Title" name="title" placeholder="e.g. Class Leader" defaultValue={duty?.title} required />
        <TextAreaField label="Duties (optional)" name="duties" rows={3} defaultValue={duty?.duties ?? ""} />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…" disabled={!duty && !studentId}>{duty ? "Save changes" : "Assign"}</Button>
      </form>
    </Modal>
  );
}
