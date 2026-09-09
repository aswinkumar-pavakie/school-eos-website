"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { ParentHomework } from "@/lib/parent-api";
import { submitHomeworkAction, type FormState } from "./actions";

const initial: FormState = {};

export function SubmitHomeworkModal({ studentId, homework }: { studentId: string; homework: ParentHomework }) {
  const action = submitHomeworkAction.bind(null, studentId, homework.id);
  const [state, formAction] = useActionState(action, initial);
  const alreadySubmitted = homework.submissionStatus === "SUBMITTED" || homework.submissionStatus === "LATE";

  return (
    <Modal
      title={alreadySubmitted ? "Update submission" : "Submit homework"}
      trigger={
        <PlainButton variant={alreadySubmitted ? "secondary" : "primary"}>
          {alreadySubmitted ? "Update submission" : "Submit"}
        </PlainButton>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <TextAreaField label="Note (optional)" name="note" rows={3} defaultValue={homework.note ?? ""} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="files" className="text-xs font-bold tracking-wide text-text-muted uppercase">
            Attachments
          </label>
          <input
            id="files"
            name="files"
            type="file"
            multiple
            accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text file:mr-3 file:rounded-[var(--radius-input)] file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
          />
        </div>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Submitting…">
          {alreadySubmitted ? "Save changes" : "Submit"}
        </Button>
      </form>
    </Modal>
  );
}
