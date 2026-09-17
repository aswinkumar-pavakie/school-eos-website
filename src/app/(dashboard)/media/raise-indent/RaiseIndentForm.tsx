"use client";

import { useActionState } from "react";
import { PrimaryButton, Select, TextArea, TextInput } from "@/components/media-ui/primitives";
import { createMediaIndentAction, type FormState } from "./actions";

const initial: FormState = {};

export function RaiseIndentForm() {
  const [state, formAction] = useActionState(createMediaIndentAction, initial);
  return (
    <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "26px 28px", marginTop: 26 }}>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>Indent details</div>
      <form action={formAction}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginTop: 20 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Indent title</div>
            <TextInput name="itemName" placeholder="e.g. New wireless microphone set for events" style={{ height: 50 }} required />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Indent type</div>
            <Select name="requestType" defaultValue="GOODS" style={{ height: 50 }}>
              <option value="GOODS">Capital equipment</option>
              <option value="SERVICE">Service</option>
            </Select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginTop: 18 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Quantity</div>
            <TextInput name="quantity" type="number" min={1} defaultValue={1} style={{ height: 50 }} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Estimated cost (₹)</div>
            <TextInput name="estimatedCostRupees" placeholder="35,000" style={{ height: 50 }} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Needed by</div>
            <TextInput name="neededBy" type="date" style={{ height: 50 }} />
          </div>
        </div>
        {/* The design's own "Budget head" select has no real column anywhere on
            purchase_request -- honestly dropped rather than captured and
            silently discarded (same rule as every other undroppable-but-unreal
            field elsewhere in this rebuild). */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Justification</div>
          <TextArea name="description" rows={4} placeholder="Why the media room needs this — current gear shortfall, events affected, vendor quotations attached." />
        </div>
        {state.error && <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 9, background: "var(--med-red-bg)", color: "var(--med-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
          <span style={{ fontSize: 13, color: "var(--med-tertiary)" }}>Route: Media Room Head → Principal</span>
          <div style={{ flex: 1 }} />
          <PrimaryButton type="submit" style={{ height: 48, padding: "0 24px" }}>Submit indent</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
