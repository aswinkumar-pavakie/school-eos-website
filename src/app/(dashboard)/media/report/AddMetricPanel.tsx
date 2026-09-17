"use client";

import { useState } from "react";
import { PrimaryButton, SecondaryButton, TextInput } from "@/components/media-ui/primitives";
import { createMetricAction } from "./actions";

export function AddMetricPanel({ academicYearId }: { academicYearId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [now, setNow] = useState("");
  const [target, setTarget] = useState("");
  const [pct, setPct] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  function reset() {
    setOpen(false);
    setName("");
    setNow("");
    setTarget("");
    setPct("");
    setError(undefined);
  }

  async function submit() {
    setPending(true);
    setError(undefined);
    try {
      await createMetricAction({ academicYearId, name, nowValue: now, targetValue: target, attainmentPct: pct });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add this metric.");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <PrimaryButton type="button" onClick={() => setOpen(true)} style={{ height: 48, padding: "0 22px" }}>
        + Add metric
      </PrimaryButton>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "24px 26px", marginTop: 22, width: "100%" }}>
      <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.4px" }}>New report metric</div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 16, marginTop: 18 }}>
        <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Metric name</div><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PTA turnout" /></div>
        <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>This year</div><TextInput value={now} onChange={(e) => setNow(e.target.value)} placeholder="92" /></div>
        <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Target</div><TextInput value={target} onChange={(e) => setTarget(e.target.value)} placeholder="100" /></div>
        <div><div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>Attainment %</div><TextInput value={pct} onChange={(e) => setPct(e.target.value)} placeholder="92" /></div>
      </div>
      {error && <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 9, background: "var(--med-red-bg)", color: "var(--med-red)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
      <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "flex-end" }}>
        <SecondaryButton type="button" onClick={reset} disabled={pending} style={{ height: 46, padding: "0 20px" }}>Cancel</SecondaryButton>
        <PrimaryButton type="button" onClick={submit} disabled={pending} style={{ height: 46, padding: "0 22px" }}>{pending ? "Adding…" : "Add metric"}</PrimaryButton>
      </div>
    </div>
  );
}
