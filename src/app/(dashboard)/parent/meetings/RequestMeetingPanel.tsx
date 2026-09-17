"use client";

import { useActionState, useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/parent-ui/primitives";
import { createMeetingBookingAction, type FormState } from "./actions";

const initial: FormState = {};

export function RequestMeetingPanel({ studentId, slotId, facultyName }: { studentId: string; slotId: string; facultyName: string }) {
  const [open, setOpen] = useState(false);
  const action = createMeetingBookingAction.bind(null, studentId, slotId);
  const [state, formAction] = useActionState(action, initial);

  if (!open) {
    return (
      <PrimaryButton type="button" onClick={() => setOpen(true)} style={{ padding: "8px 16px", fontSize: 13 }}>
        Request
      </PrimaryButton>
    );
  }

  return (
    <form action={formAction} style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
      <textarea
        name="notes"
        rows={2}
        placeholder={`Note for ${facultyName} (optional)`}
        style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-input)", padding: "10px 14px", fontSize: 13.5, fontFamily: "inherit", resize: "vertical" }}
      />
      {state.error && <div style={{ padding: "8px 12px", borderRadius: 9, background: "var(--par-red-bg)", color: "var(--par-red)", fontSize: 12.5, fontWeight: 600 }}>{state.error}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <SecondaryButton type="button" onClick={() => setOpen(false)} style={{ padding: "8px 16px", fontSize: 13 }}>Cancel</SecondaryButton>
        <PrimaryButton type="submit" style={{ padding: "8px 16px", fontSize: 13 }}>Request slot</PrimaryButton>
      </div>
    </form>
  );
}
