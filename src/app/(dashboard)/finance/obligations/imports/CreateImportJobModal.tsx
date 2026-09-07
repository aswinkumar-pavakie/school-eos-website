"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlainButton, Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { createImportJobAction, type FormState } from "./actions";

const initial: FormState = {};

export function CreateImportJobModal() {
  const [state, formAction] = useActionState(createImportJobAction, initial);
  return (
    <Modal title="New bulk import job" trigger={<PlainButton variant="primary">+ New import job</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="File name" name="fileName" required placeholder="e.g. grade9-term2.csv" />
        <p className="text-xs text-text-muted">Row data is entered directly on the job's own page — no file upload yet.</p>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Creating…">Create job</Button>
      </form>
    </Modal>
  );
}
