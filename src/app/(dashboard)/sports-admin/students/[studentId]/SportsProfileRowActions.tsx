"use client";

import { useActionState, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, TextInput } from "@/components/sports-ui/primitives";
import { DeleteButton } from "@/components/sports-ui/DeleteButton";
import type { SportsProfile } from "@/lib/sports-admin-api";
import { setSportsProfileStatusAction, updateSportsProfileAction, type FormState } from "./actions";

const initial: FormState = {};

export function SportsProfileRowActions({ studentId, profile }: { studentId: string; profile: SportsProfile }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateSportsProfileAction.bind(null, studentId, profile.sportId, profile.id);
  const [state, formAction] = useActionState(boundUpdate, initial);

  if (editing) {
    return (
      <div style={{ position: "absolute", zIndex: 15, top: "100%", right: 0, marginTop: 4, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 12, padding: "16px 18px", width: 260, boxShadow: "0 12px 32px rgba(16,35,59,0.16)" }}>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div><FieldLabel>Position / role</FieldLabel><TextInput name="positionOrRole" defaultValue={profile.positionOrRole ?? ""} /></div>
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
    <div style={{ display: "flex", gap: 10, alignItems: "center", position: "relative" }}>
      <button type="button" onClick={() => setEditing(true)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-primary)", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
        Edit
      </button>
      {profile.status === "ACTIVE" ? (
        <DeleteButton
          label="Deactivate"
          confirmMessage="Deactivate this sport enrollment?"
          action={() => setSportsProfileStatusAction(studentId, profile.sportId, profile.id, "INACTIVE")}
          successMessage="Enrollment deactivated."
        />
      ) : (
        <DeleteButton
          label="Reactivate"
          confirmMessage="Reactivate this sport enrollment?"
          action={() => setSportsProfileStatusAction(studentId, profile.sportId, profile.id, "ACTIVE")}
          successMessage="Enrollment reactivated."
        />
      )}
    </div>
  );
}
