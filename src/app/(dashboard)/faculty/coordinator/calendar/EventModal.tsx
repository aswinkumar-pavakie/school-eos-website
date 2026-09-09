"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { CoordinatorCalendarEvent } from "@/lib/faculty-coordinator-api";
import { createCalendarEventAction, updateCalendarEventAction, type FormState } from "../actions";

const initial: FormState = {};
const EVENT_TYPES = ["HOLIDAY", "TERM_START", "TERM_END", "EXAM_WINDOW", "PTM", "FUNCTION", "COMPETITION", "WORKING_SATURDAY", "OTHER"];
const STAGE_LABELS: Record<string, string> = {
  PRE_PRIMARY: "Pre-Primary", PRIMARY: "Primary", MIDDLE: "Middle", SECONDARY: "Secondary", HIGHER_SECONDARY: "Higher Secondary",
};

export function EventModal({ stages, event }: { stages: string[]; event?: CoordinatorCalendarEvent }) {
  const action = event ? updateCalendarEventAction.bind(null, event.id) : createCalendarEventAction;
  const [state, formAction] = useActionState(action, initial);

  return (
    <Modal title={event ? "Edit event" : "New event"} trigger={<PlainButton variant={event ? "secondary" : "primary"}>{event ? "Edit" : "+ New event"}</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        {!event && stages.length > 1 ? (
          <SelectField label="Stage" name="scopeStage" defaultValue={stages[0]}>
            {stages.map((s) => <option key={s} value={s}>{STAGE_LABELS[s] ?? s}</option>)}
          </SelectField>
        ) : !event ? (
          <input type="hidden" name="scopeStage" value={stages[0]} />
        ) : null}
        <TextField label="Title" name="title" defaultValue={event?.title} required />
        <SelectField label="Type" name="eventType" defaultValue={event?.eventType ?? "OTHER"}>
          {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </SelectField>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Start date" name="startDate" type="date" defaultValue={event?.startDate.slice(0, 10)} required />
          <TextField label="End date" name="endDate" type="date" defaultValue={event?.endDate.slice(0, 10)} required />
        </div>
        <TextAreaField label="Description (optional)" name="description" rows={2} defaultValue={event?.description ?? ""} />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">{event ? "Save changes" : "Create event"}</Button>
      </form>
    </Modal>
  );
}
