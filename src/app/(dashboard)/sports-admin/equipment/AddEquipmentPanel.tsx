"use client";

import { useActionState, useEffect, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, TextInput } from "@/components/sports-ui/primitives";
import type { Sport } from "@/lib/sports-admin-api";
import { createEquipmentItemAction, type FormState } from "./actions";

const initial: FormState = {};

// Same httpOnly-cookie reasoning as AddTeamPanel.tsx -- fetch the Route
// Handler, never sports-admin-api.ts's own functions, from a client component.
async function fetchJson<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) return [];
  const body = (await res.json()) as { data: T[] };
  return body.data;
}

export function AddEquipmentPanel() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createEquipmentItemAction, initial);
  const [sports, setSports] = useState<Sport[]>([]);

  useEffect(() => {
    if (!open) return;
    fetchJson<Sport>("/api/sports-admin/sports").then(setSports).catch(() => {});
  }, [open]);

  if (!open) return <PrimaryButton type="button" onClick={() => setOpen(true)}>+ Add equipment</PrimaryButton>;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "22px 24px", width: 400 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>New equipment item</div>
      <form action={formAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div><FieldLabel>Item name</FieldLabel><TextInput name="name" required placeholder="e.g. Football (size 5)" /></div>
        <div>
          <FieldLabel>Sport</FieldLabel>
          <Select name="sportId" defaultValue="">
            <option value="">General / shared</option>
            {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <div><FieldLabel>Total quantity</FieldLabel><TextInput name="quantityTotal" type="number" min={0} required /></div>
        <div>
          <FieldLabel>Condition</FieldLabel>
          <Select name="condition" defaultValue="">
            <option value="">Not set</option>
            <option value="NEW">New</option>
            <option value="GOOD">Good</option>
            <option value="FAIR">Fair</option>
            <option value="POOR">Poor</option>
            <option value="DAMAGED">Damaged</option>
          </Select>
        </div>
        {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Add</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
