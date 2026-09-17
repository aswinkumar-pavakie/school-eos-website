"use client";

import { useActionState, useState } from "react";
import { PrimaryButton, SecondaryButton, TextInput } from "@/components/media-ui/primitives";
import { createMediaTeamMemberAction, type FormState } from "./actions";

const initial: FormState = {};

export function AddMemberPanel() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createMediaTeamMemberAction, initial);

  if (!open) {
    return (
      <PrimaryButton type="button" onClick={() => setOpen(true)} style={{ height: 48, padding: "0 22px" }}>
        + Add member
      </PrimaryButton>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "24px 26px", marginTop: 22, width: "100%" }}>
      <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px" }}>New team member</div>
      <form action={formAction}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 18 }}>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Full name</div><TextInput name="fullName" required /></div>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Designation</div><TextInput name="designation" placeholder="e.g. Photographer" /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Email</div><TextInput name="email" type="email" /></div>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Phone</div><TextInput name="phone" /></div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Skills (comma separated)</div>
          <TextInput name="skills" placeholder="Photography, Video editing" />
        </div>
        {state.error && <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 9, background: "var(--med-red-bg)", color: "var(--med-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)} style={{ height: 46, padding: "0 20px" }}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" style={{ height: 46, padding: "0 22px" }}>Add member</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
