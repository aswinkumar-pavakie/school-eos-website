"use client";

import { useActionState, useState } from "react";
import { FieldLabel, PrimaryButton, Select, SecondaryButton, TextInput } from "@/components/sports-ui/primitives";
import { DeleteButton } from "@/components/sports-ui/DeleteButton";
import type { EquipmentItem } from "@/lib/sports-admin-api";
import { setEquipmentStatusAction, updateEquipmentItemAction, type FormState } from "./actions";

const CONDITIONS = ["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"];
const initial: FormState = {};

export function EquipmentRowActions({ item }: { item: EquipmentItem }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateEquipmentItemAction.bind(null, item.id);
  const [state, formAction] = useActionState(boundUpdate, initial);

  if (editing) {
    return (
      <div style={{ position: "absolute", zIndex: 15, top: "100%", right: 0, marginTop: 4, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 12, padding: "16px 18px", width: 280, boxShadow: "0 12px 32px rgba(16,35,59,0.16)" }}>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div><FieldLabel>Item name</FieldLabel><TextInput name="name" required defaultValue={item.name} /></div>
          <div><FieldLabel>Total quantity</FieldLabel><TextInput name="quantityTotal" type="number" min={0} required defaultValue={item.quantityTotal} /></div>
          <div>
            <FieldLabel>Condition</FieldLabel>
            <Select name="condition" defaultValue={item.condition ?? "GOOD"}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c[0]}{c.slice(1).toLowerCase()}</option>)}
            </Select>
          </div>
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
      {item.status === "ACTIVE" ? (
        <DeleteButton
          label="Retire"
          confirmMessage={`Retire "${item.name}" from the catalog? It will no longer appear in the register or be available to issue.`}
          action={() => setEquipmentStatusAction(item.id, "RETIRED")}
          successMessage="Item retired."
        />
      ) : (
        <DeleteButton
          label="Reactivate"
          confirmMessage={`Reactivate "${item.name}"?`}
          action={() => setEquipmentStatusAction(item.id, "ACTIVE")}
          successMessage="Item reactivated."
        />
      )}
    </div>
  );
}
