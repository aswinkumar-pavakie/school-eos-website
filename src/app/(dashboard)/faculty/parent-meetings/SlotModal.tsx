"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { MeetingSlot } from "@/lib/faculty-staff-api";
import { createSlotAction, updateSlotAction, type FormState } from "./actions";

const initial: FormState = {};

export function SlotModal({ slot }: { slot?: MeetingSlot }) {
  const action = slot ? updateSlotAction.bind(null, slot.id) : createSlotAction;
  const [state, formAction] = useActionState(action, initial);

  return (
    <Modal title={slot ? "Edit slot" : "New slot"} trigger={<PlainButton variant={slot ? "secondary" : "primary"}>{slot ? "Edit" : "+ Add a slot"}</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Date" name="meetingDate" type="date" defaultValue={slot?.meetingDate.slice(0, 10)} required />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="From" name="fromTime" type="time" defaultValue={slot?.fromTime.slice(0, 5)} required />
          <TextField label="To" name="toTime" type="time" defaultValue={slot?.toTime.slice(0, 5)} required />
        </div>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">{slot ? "Save changes" : "Create slot"}</Button>
      </form>
    </Modal>
  );
}
