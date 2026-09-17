"use client";

import { useActionState, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, TextArea, TextInput } from "@/components/sports-ui/primitives";
import { createCalendarEventAction, type FormState } from "./actions";

const initial: FormState = {};

export function AddEventPanel() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createCalendarEventAction, initial);

  if (!open) return <PrimaryButton type="button" onClick={() => setOpen(true)}>+ Add event</PrimaryButton>;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "22px 24px", width: 420 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>New calendar event</div>
      <form action={formAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div><FieldLabel>Title</FieldLabel><TextInput name="title" required placeholder="e.g. Inter-school Football Trials" /></div>
        <div>
          <FieldLabel>Type</FieldLabel>
          <Select name="eventType" defaultValue="COMPETITION">
            <option value="COMPETITION">Competition</option>
            <option value="FUNCTION">Function</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><FieldLabel>Start date</FieldLabel><TextInput name="startDate" type="date" required /></div>
          <div><FieldLabel>End date</FieldLabel><TextInput name="endDate" type="date" /></div>
        </div>
        <div><FieldLabel>Description</FieldLabel><TextArea name="description" rows={3} /></div>
        {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Add</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
