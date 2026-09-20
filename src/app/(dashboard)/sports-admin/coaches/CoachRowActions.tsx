"use client";

import { useActionState, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, TextInput } from "@/components/sports-ui/primitives";
import { DeleteButton } from "@/components/sports-ui/DeleteButton";
import type { Coach } from "@/lib/sports-admin-api";
import { setCoachStatusAction, updateCoachAction, type FormState } from "./actions";

const initial: FormState = {};

export function CoachRowActions({ coach }: { coach: Coach }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateCoachAction.bind(null, coach.id);
  const [state, formAction] = useActionState(boundUpdate, initial);

  if (editing) {
    return (
      <div style={{ position: "absolute", zIndex: 15, top: "100%", right: 0, marginTop: 4, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 12, padding: "16px 18px", width: 300, boxShadow: "0 12px 32px rgba(16,35,59,0.16)" }}>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div><FieldLabel>Full name</FieldLabel><TextInput name="fullName" required defaultValue={coach.fullName} /></div>
          <div><FieldLabel>Contact phone</FieldLabel><TextInput name="contactPhone" defaultValue={coach.contactPhone ?? ""} /></div>
          <div><FieldLabel>Qualification</FieldLabel><TextInput name="qualification" defaultValue={coach.qualification ?? ""} /></div>
          {state.error && <div style={{ fontSize: 12, color: "var(--sport-red)", fontWeight: 600 }}>{state.error}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <SecondaryButton type="button" onClick={() => setEditing(false)} style={{ height: 30, fontSize: 12 }}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" style={{ height: 30, fontSize: 12 }}>Save</PrimaryButton>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end", position: "relative" }}>
      <button type="button" onClick={() => setEditing(true)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-primary)", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
        Edit
      </button>
      {coach.status === "ACTIVE" ? (
        <DeleteButton
          label="Deactivate"
          confirmMessage={`Deactivate ${coach.fullName}?`}
          action={() => setCoachStatusAction(coach.id, "INACTIVE")}
          successMessage="Coach deactivated."
        />
      ) : (
        <DeleteButton
          label="Reactivate"
          confirmMessage={`Reactivate ${coach.fullName}?`}
          action={() => setCoachStatusAction(coach.id, "ACTIVE")}
          successMessage="Coach reactivated."
        />
      )}
    </div>
  );
}
