"use client";

import { useActionState, useEffect, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, TextArea, TextInput } from "@/components/sports-ui/primitives";
import type { EquipmentItem } from "@/lib/sports-admin-api";
import { listEquipmentCatalog } from "@/lib/sports-admin-api";
import { createEquipmentIndentAction, type FormState } from "./actions";

const initial: FormState = {};

export function AddIndentPanel() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createEquipmentIndentAction, initial);
  const [items, setItems] = useState<EquipmentItem[]>([]);

  useEffect(() => {
    if (!open) return;
    listEquipmentCatalog().then(setItems).catch(() => {});
  }, [open]);

  if (!open) return <PrimaryButton type="button" onClick={() => setOpen(true)}>+ New indent</PrimaryButton>;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "22px 24px", width: 420 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>New restock indent</div>
      <form action={formAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <FieldLabel>Equipment item</FieldLabel>
          <Select name="equipmentId" required defaultValue="">
            <option value="" disabled>Select an item</option>
            {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
          </Select>
        </div>
        <div><FieldLabel>Quantity</FieldLabel><TextInput name="quantity" type="number" min={1} required /></div>
        <div><FieldLabel>Reason</FieldLabel><TextArea name="reason" required rows={3} placeholder="Why this restock is needed" /></div>
        <div><FieldLabel>Preferred vendor</FieldLabel><TextInput name="vendorName" placeholder="Optional" /></div>
        {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Submit</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
