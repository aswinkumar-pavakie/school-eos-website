"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { createAppraisalAction, type FormState } from "./actions";

const initial: FormState = {};

export function AppraisalModal() {
  const [state, formAction] = useActionState(createAppraisalAction, initial);
  return (
    <Modal title="Submit self-assessment" trigger={<PlainButton variant="primary">+ Submit self-assessment</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Cycle" name="cycle" placeholder="e.g. 2026-2027" required minLength={4} />
        <TextAreaField label="Self assessment" name="selfAssessment" rows={6} placeholder="Describe your key contributions this cycle" required minLength={20} />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Submitting…">Submit</Button>
      </form>
    </Modal>
  );
}
