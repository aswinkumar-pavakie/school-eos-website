"use client";

import { useActionState, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, TextInput } from "@/components/sports-ui/primitives";
import { DeleteButton } from "@/components/sports-ui/DeleteButton";
import { setTeamStatusAction, updateTeamAction, type FormState } from "./actions";

const initial: FormState = {};

export function TeamActions({ teamId, name, status }: { teamId: string; name: string; status: string }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateTeamAction.bind(null, teamId);
  const [state, formAction] = useActionState(boundUpdate, initial);

  if (editing) {
    return (
      <form action={formAction} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <TextInput name="name" defaultValue={name} required style={{ maxWidth: 260 }} />
        {state.error && <span style={{ fontSize: 12.5, color: "var(--sport-red)", fontWeight: 600 }}>{state.error}</span>}
        <PrimaryButton type="submit" style={{ height: 34, fontSize: 13 }}>Save</PrimaryButton>
        <SecondaryButton type="button" onClick={() => setEditing(false)} style={{ height: 34, fontSize: 13 }}>Cancel</SecondaryButton>
      </form>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <button type="button" onClick={() => setEditing(true)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-primary)", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
        Edit
      </button>
      {status === "ACTIVE" ? (
        <DeleteButton
          label="Deactivate"
          confirmMessage={`Deactivate "${name}"? It will no longer appear as an active squad, but its history is kept.`}
          action={() => setTeamStatusAction(teamId, "INACTIVE")}
          successMessage="Squad deactivated."
        />
      ) : (
        <DeleteButton
          label="Reactivate"
          confirmMessage={`Reactivate "${name}"?`}
          action={() => setTeamStatusAction(teamId, "ACTIVE")}
          successMessage="Squad reactivated."
        />
      )}
    </div>
  );
}
