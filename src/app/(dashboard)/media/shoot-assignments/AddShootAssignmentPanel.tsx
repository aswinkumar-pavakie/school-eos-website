"use client";

import { useActionState, useState } from "react";
import { PrimaryButton, SecondaryButton, Select, TextInput } from "@/components/media-ui/primitives";
import type { MediaInventoryItem, MediaTeamMember } from "@/lib/media-api";
import { createShootAssignmentAction, type FormState } from "./actions";

const initial: FormState = {};

export function AddShootAssignmentPanel({ crew, gear }: { crew: MediaTeamMember[]; gear: MediaInventoryItem[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createShootAssignmentAction, initial);

  if (!open) {
    return (
      <PrimaryButton type="button" onClick={() => setOpen(true)} style={{ height: 52, padding: "0 26px", borderRadius: 12, fontSize: 15 }}>
        + Add shoot assignment
      </PrimaryButton>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "24px 26px", marginTop: 22, width: "100%" }}>
      <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px" }}>New shoot assignment</div>
      <form action={formAction}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 1fr 1fr", gap: 16, marginTop: 18 }}>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Date</div><TextInput type="date" name="scheduledDate" required /></div>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Event</div><TextInput name="eventTitle" placeholder="e.g. Sports Day finals" required /></div>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Time</div><TextInput type="time" name="scheduledTime" required /></div>
          <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Venue</div><TextInput name="venue" placeholder="e.g. Sports ground" /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Output</div>
            <Select name="outputType" defaultValue="PHOTO_VIDEO">
              <option value="PHOTO">Photo</option>
              <option value="VIDEO">Video</option>
              <option value="PHOTO_VIDEO">Photo + Video</option>
            </Select>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Notes</div>
            <TextInput name="notes" placeholder="Optional" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)", marginBottom: 8 }}>Crew</div>
            <div style={{ maxHeight: 128, overflowY: "auto", border: "1px solid var(--med-input-border)", borderRadius: 12, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {crew.length === 0 ? (
                <div style={{ fontSize: 12.5, color: "var(--med-tertiary)" }}>No active team members yet — add one under Media Team first.</div>
              ) : (
                crew.map((m) => (
                  <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                    <input type="checkbox" name="crewIds" value={m.id} />
                    {m.fullName}{m.designation ? ` — ${m.designation}` : ""}
                  </label>
                ))
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)", marginBottom: 8 }}>Gear issued</div>
            <div style={{ maxHeight: 128, overflowY: "auto", border: "1px solid var(--med-input-border)", borderRadius: 12, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {gear.length === 0 ? (
                <div style={{ fontSize: 12.5, color: "var(--med-tertiary)" }}>No equipment registered yet — add one under Inventory first.</div>
              ) : (
                gear.map((g) => (
                  <label key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                    <input type="checkbox" name="gearIds" value={g.id} />
                    {g.name}{g.assetCode ? ` (${g.assetCode})` : ""}
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {state.error && <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 9, background: "var(--med-red-bg)", color: "var(--med-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}

        <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)} style={{ height: 46, padding: "0 20px" }}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" style={{ height: 46, padding: "0 22px" }}>Add assignment</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
