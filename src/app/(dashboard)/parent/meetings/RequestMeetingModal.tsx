"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { createMeetingBookingAction, type FormState } from "./actions";

const initial: FormState = {};

export function RequestMeetingModal({
  studentId,
  slotId,
  facultyName,
}: {
  studentId: string;
  slotId: string;
  facultyName: string;
}) {
  const action = createMeetingBookingAction.bind(null, studentId, slotId);
  const [state, formAction] = useActionState(action, initial);

  return (
    <Modal title={`Request a meeting with ${facultyName}`} trigger={<PlainButton variant="primary">Request</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextAreaField label="Notes (optional)" name="notes" rows={3} />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Requesting…">Request slot</Button>
      </form>
    </Modal>
  );
}
