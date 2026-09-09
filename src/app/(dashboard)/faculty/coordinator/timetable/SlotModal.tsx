"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { CoordinatorOffering } from "@/lib/faculty-coordinator-api";
import { upsertSlotAction, type FormState } from "../actions";

const initial: FormState = {};

export function SlotModal({
  sectionId,
  dayOfWeek,
  periodId,
  periodLabel,
  offerings,
}: {
  sectionId: string;
  dayOfWeek: number;
  periodId: string;
  periodLabel: string;
  offerings: CoordinatorOffering[];
}) {
  const [state, formAction] = useActionState(upsertSlotAction.bind(null, sectionId, dayOfWeek, periodId), initial);
  return (
    <Modal title="Fill this period" trigger={<PlainButton variant="secondary" className="w-full">+ Fill</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">{periodLabel}</p>
        <SelectField label="Subject" name="subjectOfferingId" required defaultValue="">
          <option value="" disabled>Select…</option>
          {offerings.map((o) => <option key={o.subjectOfferingId} value={o.subjectOfferingId}>{o.subjectName}{o.teacherName ? ` · ${o.teacherName}` : " · Unassigned"}</option>)}
        </SelectField>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">Save as draft</Button>
      </form>
    </Modal>
  );
}
