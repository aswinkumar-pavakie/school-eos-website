"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextAreaField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { DOCUMENT_TYPES } from "@/lib/document-types";
import { docTypeLabel } from "./labels";
import { createDocumentRequestAction, type FormState } from "./actions";

const initial: FormState = {};

export function NewDocumentRequestModal({ studentId }: { studentId: string }) {
  const [state, formAction] = useActionState(createDocumentRequestAction, initial);

  return (
    <Modal title="Request a document" trigger={<PlainButton variant="primary">+ New request</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="studentId" value={studentId} required />
        <SelectField label="Document type" name="docType" required defaultValue="">
          <option value="" disabled>Select…</option>
          {DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>{docTypeLabel(t)}</option>
          ))}
        </SelectField>
        <TextAreaField label="Reason" name="reason" rows={3} required />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Submitting…">Submit request</Button>
      </form>
    </Modal>
  );
}
