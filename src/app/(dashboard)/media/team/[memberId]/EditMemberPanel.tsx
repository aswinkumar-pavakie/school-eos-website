"use client";

import { useActionState, useState } from "react";
import { PrimaryButton, Select, SecondaryButton, TextInput } from "@/components/media-ui/primitives";
import type { MediaTeamMemberDetail } from "@/lib/media-api";
import { updateMediaTeamMemberAction, type FormState } from "../actions";

const initial: FormState = {};

export function EditMemberPanel({ member }: { member: MediaTeamMemberDetail }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updateMediaTeamMemberAction.bind(null, member.id), initial);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="media-btn-hover-ghost" style={{ height: 40, padding: "0 16px", borderRadius: 9, border: "1px solid var(--med-border)", background: "#fff", fontSize: 13, fontWeight: 700, color: "var(--med-primary)", cursor: "pointer", fontFamily: "inherit" }}>
        Edit details
      </button>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "20px 24px", marginTop: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 800 }}>Edit team member</div>
      <form action={formAction}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginTop: 14 }}>
          <TextInput name="fullName" defaultValue={member.fullName} placeholder="Full name" style={{ marginTop: 0 }} />
          <TextInput name="designation" defaultValue={member.designation ?? ""} placeholder="Designation" style={{ marginTop: 0 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
          <TextInput name="email" type="email" defaultValue={member.email ?? ""} placeholder="Email" style={{ marginTop: 0 }} />
          <TextInput name="phone" defaultValue={member.phone ?? ""} placeholder="Phone" style={{ marginTop: 0 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14, marginTop: 12 }}>
          <TextInput name="skills" defaultValue={member.skills.join(", ")} placeholder="Skills (comma separated)" style={{ marginTop: 0 }} />
          <Select name="status" defaultValue={member.status} style={{ marginTop: 0 }}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
        {state.error && <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "var(--med-red-bg)", color: "var(--med-red)", fontSize: 12.5, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)} style={{ height: 40, padding: "0 16px", fontSize: 13 }}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" style={{ height: 40, padding: "0 18px", fontSize: 13 }}>Save changes</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
