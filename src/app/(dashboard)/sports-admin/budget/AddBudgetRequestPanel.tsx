"use client";

import { useActionState, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, TextArea, TextInput } from "@/components/sports-ui/primitives";
import { createBudgetRequestAction, type FormState } from "./actions";

const initial: FormState = {};

export function AddBudgetRequestPanel() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createBudgetRequestAction, initial);

  if (!open) return <PrimaryButton type="button" onClick={() => setOpen(true)}>+ Raise request</PrimaryButton>;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "22px 24px", width: 420 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>New budget request</div>
      <form action={formAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div><FieldLabel>Request</FieldLabel><TextInput name="title" required placeholder="e.g. Coach travel for state meet" /></div>
        <div><FieldLabel>Description (optional)</FieldLabel><TextArea name="description" rows={2} /></div>
        <div><FieldLabel>Estimated amount (₹)</FieldLabel><TextInput name="estimatedAmountPaise" type="number" min="1" step="0.01" required /></div>
        {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Submit</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
