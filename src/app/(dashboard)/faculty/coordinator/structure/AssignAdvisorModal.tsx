"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { EligibleFaculty } from "@/lib/faculty-coordinator-api";
import { assignAdvisorAction, type FormState } from "../actions";

const initial: FormState = {};

export function AssignAdvisorModal({
  sectionId,
  sectionLabel,
  faculty,
  currentAdvisorName,
}: {
  sectionId: string;
  sectionLabel: string;
  faculty: EligibleFaculty[];
  currentAdvisorName: string | null;
}) {
  const [state, formAction] = useActionState(assignAdvisorAction.bind(null, sectionId), initial);
  return (
    <Modal
      title={currentAdvisorName ? "Change class advisor" : "Assign class advisor"}
      trigger={<PlainButton variant={currentAdvisorName ? "secondary" : "primary"}>{currentAdvisorName ? "Change" : "Assign"}</PlainButton>}
    >
      <form action={formAction} className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">{sectionLabel}</p>
        <SelectField label="Faculty member" name="personId" required defaultValue="">
          <option value="" disabled>Select…</option>
          {faculty.map((f) => <option key={f.personId} value={f.personId}>{f.name}{f.designation ? ` · ${f.designation}` : ""}</option>)}
        </SelectField>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">{currentAdvisorName ? "Change advisor" : "Assign advisor"}</Button>
      </form>
    </Modal>
  );
}
