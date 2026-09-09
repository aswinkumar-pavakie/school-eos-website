"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/EmptyState";
import { uploadFileAction, type FormState } from "../../actions";

const initial: FormState = {};
const ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp";

export function UploadForm({ folderId }: { folderId: string }) {
  const [state, formAction] = useActionState(uploadFileAction.bind(null, folderId), initial);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-dashed border-border bg-field p-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="file" className="text-xs font-bold uppercase tracking-wide text-text-muted">Upload a file</label>
        <input id="file" name="file" type="file" accept={ACCEPT} required className="text-sm text-text" />
      </div>
      <Button variant="primary" pendingLabel="Uploading…">Upload</Button>
      <FieldError message={state.error} />
    </form>
  );
}
