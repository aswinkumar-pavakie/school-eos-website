"use client";

import { useState } from "react";
import { PrimaryButton, SecondaryButton, TextInput } from "@/components/media-ui/primitives";
import { useFlash } from "@/components/media-ui/FlashContext";
import { createMediaEventAction } from "./actions";

export function AddMediaEventPanel({ academicYearId }: { academicYearId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [callTime, setCallTime] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const { showFlash } = useFlash();

  function reset() {
    setOpen(false);
    setTitle("");
    setDate("");
    setCallTime("");
    setError(undefined);
  }

  async function submit() {
    setPending(true);
    setError(undefined);
    try {
      await createMediaEventAction({ academicYearId, title, date, callTime });
      showFlash("Added to the academic calendar.");
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this event.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <PrimaryButton type="button" onClick={() => setOpen(true)} style={{ height: 52, padding: "0 26px", borderRadius: 12, fontSize: 15 }}>
        + Add media event
      </PrimaryButton>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "24px 26px", marginTop: 24, width: "100%" }}>
      <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px" }}>New media event</div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, marginTop: 18 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Event title</div>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Independence Day flag hoisting" />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Date</div>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Call time</div>
          <TextInput type="time" value={callTime} onChange={(e) => setCallTime(e.target.value)} />
        </div>
      </div>
      {error && <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 9, background: "var(--med-red-bg)", color: "var(--med-red)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
      <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
        <SecondaryButton type="button" onClick={reset} disabled={pending} style={{ height: 46, padding: "0 20px" }}>Cancel</SecondaryButton>
        <PrimaryButton type="button" onClick={submit} disabled={pending} style={{ height: 46, padding: "0 22px" }}>{pending ? "Adding…" : "Add to calendar"}</PrimaryButton>
      </div>
    </div>
  );
}
