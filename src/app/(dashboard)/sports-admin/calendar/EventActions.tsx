"use client";

import { useActionState, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, TextArea, TextInput } from "@/components/sports-ui/primitives";
import { DeleteButton } from "@/components/sports-ui/DeleteButton";
import type { CalendarEvent } from "@/lib/sports-admin-api";
import { deleteCalendarEventAction, updateCalendarEventAction, type FormState } from "./actions";

const initial: FormState = {};

// Only rendered for events this signed-in account created (see the page's
// own createdBy check) -- the backend's assertCanModify would 403 on
// anyone else's event regardless, this just avoids showing a button that
// can't work.
export function EventActions({ event }: { event: CalendarEvent }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateCalendarEventAction.bind(null, event.id);
  const [state, formAction] = useActionState(boundUpdate, initial);

  if (!editing) {
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button type="button" onClick={() => setEditing(true)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-primary)", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
          Edit
        </button>
        <DeleteButton
          confirmMessage={`Delete "${event.title}"? This cannot be undone.`}
          action={() => deleteCalendarEventAction(event.id)}
          successMessage="Event deleted."
        />
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "18px 20px", width: "100%" }}>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div><FieldLabel>Title</FieldLabel><TextInput name="title" required defaultValue={event.title} /></div>
        <div>
          <FieldLabel>Type</FieldLabel>
          <Select name="eventType" defaultValue={event.eventType}>
            <option value="COMPETITION">Competition</option>
            <option value="FUNCTION">Function</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><FieldLabel>Start date</FieldLabel><TextInput name="startDate" type="date" required defaultValue={event.startDate.slice(0, 10)} /></div>
          <div><FieldLabel>End date</FieldLabel><TextInput name="endDate" type="date" defaultValue={event.endDate.slice(0, 10)} /></div>
        </div>
        <div><FieldLabel>Description</FieldLabel><TextArea name="description" rows={2} defaultValue={event.description ?? ""} /></div>
        {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setEditing(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Save</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
