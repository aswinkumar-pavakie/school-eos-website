"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { LmsTask } from "@/lib/faculty-lms-api";
import { createTaskAction, updateTaskAction, type FormState } from "../actions";

const initial: FormState = {};

export function TaskModal({ subjectOfferingId, task }: { subjectOfferingId: string; task?: LmsTask }) {
  const action = task ? updateTaskAction.bind(null, task.id) : createTaskAction.bind(null, subjectOfferingId);
  const [state, formAction] = useActionState(action, initial);

  return (
    <Modal title={task ? "Edit task" : "New task"} trigger={<PlainButton variant={task ? "secondary" : "primary"}>{task ? "Edit" : "+ New task"}</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Title" name="title" placeholder="e.g. Worksheet 3" defaultValue={task?.title} required />
        <TextAreaField label="Description (optional)" name="description" rows={3} defaultValue={task?.description ?? ""} />
        <TextField label="Due date (optional)" name="dueDate" type="date" defaultValue={task?.dueDate?.slice(0, 10) ?? ""} />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">{task ? "Save changes" : "Create task"}</Button>
      </form>
    </Modal>
  );
}
