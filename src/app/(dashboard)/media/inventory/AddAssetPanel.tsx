"use client";

import { useActionState, useState } from "react";
import { PrimaryButton, SecondaryButton, TextInput } from "@/components/media-ui/primitives";
import { createMediaInventoryItemAction, type FormState } from "./actions";

const initial: FormState = {};

export function AddAssetPanel() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createMediaInventoryItemAction, initial);

  if (!open) {
    return (
      <PrimaryButton type="button" onClick={() => setOpen(true)} style={{ height: 48, padding: "0 22px" }}>
        + Add asset
      </PrimaryButton>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "24px 26px", marginTop: 22, width: "100%" }}>
      <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px" }}>New asset</div>
      <form action={formAction}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 16, marginTop: 18 }}>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Asset tag</div><TextInput name="assetCode" placeholder="MR-CAM-015" /></div>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Equipment name</div><TextInput name="name" placeholder="e.g. Nikon Z6 III body" required /></div>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Serial / description</div><TextInput name="description" placeholder="Serial no." /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 16 }}>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Quantity</div><TextInput name="quantity" type="number" min={1} defaultValue={1} /></div>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Holder / location</div><TextInput name="location" placeholder="e.g. Media room · shelf B2" /></div>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Invoice value (₹)</div><TextInput name="acquisitionCostRupees" placeholder="1,20,000" /></div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Vendor</div>
          <TextInput name="vendor" />
        </div>
        {state.error && <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 9, background: "var(--med-red-bg)", color: "var(--med-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)} style={{ height: 46, padding: "0 20px" }}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" style={{ height: 46, padding: "0 22px" }}>Add asset</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
