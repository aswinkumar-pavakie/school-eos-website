"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { LmsFolder } from "@/lib/faculty-lms-api";
import { createFolderAction, updateFolderAction, type FormState } from "../actions";

const initial: FormState = {};

// Shared between the subject-detail page (creating a folder) and the
// folder-detail page (editing one) -- one modal, not two lookalikes.
export function FolderModal({
  subjectId,
  classes,
  folder,
}: {
  subjectId: string;
  classes: { subjectOfferingId: string; gradeName: string; sectionName: string }[];
  folder?: LmsFolder;
}) {
  const action = folder ? updateFolderAction.bind(null, folder.id, subjectId) : createFolderAction.bind(null, subjectId);
  const [state, formAction] = useActionState(action, initial);
  const currentShareIds = new Set(folder?.shareOfferingIds ?? classes.map((c) => c.subjectOfferingId));

  return (
    <Modal title={folder ? "Edit folder" : "New folder"} trigger={<PlainButton variant={folder ? "secondary" : "primary"}>{folder ? "Edit" : "+ New folder"}</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Title" name="title" placeholder="e.g. Unit 1" defaultValue={folder?.title} required />
        <TextAreaField label="Description (optional)" name="description" rows={3} defaultValue={folder?.description ?? ""} />
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">Share with</p>
          <div className="flex flex-col gap-1.5 rounded-[var(--radius-input)] border border-border p-2">
            {classes.map((c) => (
              <label key={c.subjectOfferingId} className="flex items-center gap-2 rounded-[var(--radius-input)] px-2 py-1.5 text-sm text-text hover:bg-field">
                <input type="checkbox" name="shareOfferingIds" value={c.subjectOfferingId} defaultChecked={currentShareIds.has(c.subjectOfferingId)} className="h-4 w-4 rounded border-border" />
                {c.gradeName} {c.sectionName}
              </label>
            ))}
          </div>
        </div>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">{folder ? "Save changes" : "Create folder"}</Button>
      </form>
    </Modal>
  );
}
