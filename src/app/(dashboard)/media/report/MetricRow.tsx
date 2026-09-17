"use client";

import { useState } from "react";
import { PrimaryButton, SecondaryButton, TextInput } from "@/components/media-ui/primitives";
import type { MediaReportMetric } from "@/lib/media-api";
import { deleteMetricAction, updateMetricAction } from "./actions";

function parsePct(raw: string | null): number {
  if (!raw) return 0;
  const n = Number(raw.replace("%", "").trim());
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

export function MetricRow({ metric, canModify }: { metric: MediaReportMetric; canModify: boolean }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(metric.name);
  const [now, setNow] = useState(metric.nowValue);
  const [target, setTarget] = useState(metric.targetValue ?? "");
  const [pct, setPct] = useState(metric.attainmentPct ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSave() {
    setPending(true);
    setError(undefined);
    const result = await updateMetricAction(metric.id, { name, nowValue: now, targetValue: target, attainmentPct: pct });
    setPending(false);
    if (result.error) setError(result.error);
    else setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete the "${metric.name}" metric?`)) return;
    setPending(true);
    const result = await deleteMetricAction(metric.id);
    setPending(false);
    if (result.error) setError(result.error);
  }

  if (editing) {
    return (
      <div style={{ padding: "15px 0", borderBottom: "1px solid var(--med-divider-2)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Metric name" style={{ marginTop: 0 }} />
          <TextInput value={now} onChange={(e) => setNow(e.target.value)} placeholder="This year" style={{ marginTop: 0 }} />
          <TextInput value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target" style={{ marginTop: 0 }} />
          <TextInput value={pct} onChange={(e) => setPct(e.target.value)} placeholder="Attainment %" style={{ marginTop: 0 }} />
        </div>
        {error && <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "var(--med-red-bg)", color: "var(--med-red)", fontSize: 12.5, fontWeight: 600 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setEditing(false)} style={{ height: 36, padding: "0 14px", fontSize: 12.5 }}>Cancel</SecondaryButton>
          <PrimaryButton type="button" disabled={pending} onClick={handleSave} style={{ height: 36, padding: "0 16px", fontSize: 12.5 }}>Save</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="media-scorecard-row-hover" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.3fr auto", gap: 16, padding: "15px 0", borderBottom: "1px solid var(--med-divider-2)", alignItems: "center" }}>
      <span style={{ fontSize: 15, fontWeight: 700 }}>{metric.name}</span>
      <span style={{ fontFamily: "var(--med-mono)", fontSize: 14, textAlign: "right" }}>{metric.nowValue}</span>
      <span style={{ fontFamily: "var(--med-mono)", fontSize: 14, textAlign: "right", color: "var(--med-body-muted)" }}>{metric.targetValue ?? "—"}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
        <div style={{ width: 120, height: 7, borderRadius: 4, background: "var(--med-panel)", overflow: "hidden" }}>
          <div style={{ width: `${parsePct(metric.attainmentPct)}%`, height: "100%", background: "var(--med-primary)" }} />
        </div>
        <span style={{ fontFamily: "var(--med-mono)", fontSize: 13.5, width: 38, textAlign: "right" }}>{metric.attainmentPct ?? "—"}</span>
      </div>
      {canModify ? (
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" onClick={() => setEditing(true)} style={{ height: 30, padding: "0 10px", borderRadius: 7, border: "1px solid #d9dee7", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "var(--med-primary)", fontFamily: "inherit" }}>Edit</button>
          <button type="button" disabled={pending} onClick={handleDelete} style={{ height: 30, padding: "0 10px", borderRadius: 7, border: "1px solid #d9dee7", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "var(--med-red)", fontFamily: "inherit" }}>Delete</button>
        </div>
      ) : <span />}
      {error && <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--med-red)", fontWeight: 600 }}>{error}</div>}
    </div>
  );
}
