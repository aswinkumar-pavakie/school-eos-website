"use client";

import { useActionState, useState } from "react";
import { FieldLabel, PrimaryButton, Select, SecondaryButton, TextInput } from "@/components/sports-ui/primitives";
import { DeleteButton } from "@/components/sports-ui/DeleteButton";
import type { MeritPointRow } from "@/lib/sports-admin-api";
import { deleteMeritPointAction, updateMeritPointAction, type FormState } from "./actions";

const initial: FormState = {};

interface HouseOption {
  houseId: string;
  houseName: string;
}

export function MeritPointRowActions({ meritPoint, houses }: { meritPoint: MeritPointRow; houses: HouseOption[] }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateMeritPointAction.bind(null, meritPoint.id);
  const [state, formAction] = useActionState(boundUpdate, initial);

  if (editing) {
    return (
      <div style={{ position: "absolute", zIndex: 15, top: "100%", right: 0, marginTop: 4, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 12, padding: "16px 18px", width: 300, boxShadow: "0 12px 32px rgba(16,35,59,0.16)" }}>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <FieldLabel>House</FieldLabel>
            <Select name="houseId" defaultValue={meritPoint.houseId ?? ""}>
              {houses.map((h) => <option key={h.houseId} value={h.houseId}>{h.houseName}</option>)}
            </Select>
          </div>
          <div><FieldLabel>Points (1-20)</FieldLabel><TextInput name="points" type="number" min={1} max={20} required defaultValue={meritPoint.points} /></div>
          <div><FieldLabel>Reason</FieldLabel><TextInput name="reason" required defaultValue={meritPoint.reason} /></div>
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
      <DeleteButton
        confirmMessage={`Delete this ${meritPoint.points}-point award for ${meritPoint.studentFirstName}? This cannot be undone.`}
        action={() => deleteMeritPointAction(meritPoint.id)}
        successMessage="Award deleted."
      />
    </div>
  );
}
