"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { createStaffLeaveAction, type FormState } from "./actions";

const initial: FormState = {};

export function RequestModal() {
  const [state, formAction] = useActionState(createStaffLeaveAction, initial);
  return (
    <Modal title="Request leave / OD" trigger={<PlainButton variant="primary">+ New request</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <SelectField label="Type" name="leaveType" defaultValue="CASUAL">
          <option value="CASUAL">Casual leave</option>
          <option value="MEDICAL">Medical leave</option>
          <option value="EARNED">Earned leave</option>
          <option value="ON_DUTY">On duty (OD)</option>
        </SelectField>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="From" name="fromDate" type="date" required />
          <TextField label="To" name="toDate" type="date" required />
        </div>
        <TextAreaField label="Reason" name="reason" rows={3} required minLength={3} />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Submitting…">Submit request</Button>
      </form>
    </Modal>
  );
}
