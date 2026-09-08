"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { HomeworkItem } from "@/lib/faculty-api";
import { createHomeworkAction, updateHomeworkAction, type FormState } from "./actions";

const initial: FormState = {};

export function HomeworkModal({
  classes,
  homework,
}: {
  classes: { subjectOfferingId: string; label: string }[];
  homework?: HomeworkItem;
}) {
  const action = homework ? updateHomeworkAction.bind(null, homework.id) : createHomeworkAction;
  const [state, formAction] = useActionState(action, initial);

  return (
    <Modal
      title={homework ? "Edit assignment" : "New assignment"}
      trigger={<PlainButton variant={homework ? "secondary" : "primary"}>{homework ? "Edit" : "+ Post assignment"}</PlainButton>}
    >
      <form action={formAction} className="flex flex-col gap-4">
        {!homework ? (
          <SelectField label="Class" name="subjectOfferingId" required defaultValue="">
            <option value="" disabled>Select…</option>
            {classes.map((c) => <option key={c.subjectOfferingId} value={c.subjectOfferingId}>{c.label}</option>)}
          </SelectField>
        ) : null}
        <TextField label="Title" name="title" defaultValue={homework?.title} required />
        <TextAreaField label="Description (optional)" name="description" rows={3} defaultValue={homework?.description ?? ""} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Due date" name="dueDate" type="date" defaultValue={homework?.dueDate.slice(0, 10)} required />
          <TextField label="Max marks (optional)" name="maxMarks" type="number" min="1" defaultValue={homework?.maxMarks ?? ""} />
        </div>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">{homework ? "Save changes" : "Post assignment"}</Button>
      </form>
    </Modal>
  );
}
