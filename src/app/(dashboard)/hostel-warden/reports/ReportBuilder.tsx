"use client";

import { useMemo, useState } from "react";
import { Card, PrimaryButton } from "@/components/hostel-warden-ui/primitives";

export interface ReportSection {
  key: string;
  label: string;
  note: string;
  rows: (string | number)[][];
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// The design's own report-builder picks from sections like "Students with
// pending fees"/"Feedback" that have no real backend aggregate, and its own
// date range/download produce nothing real (a decorative toast). This
// rebuild keeps the same picker-tile + date-range shape, but every tile is
// a section this module genuinely has real data for (Occupancy/Complaints/
// Gate movement/Fees -- the same four this page already computed), and
// Download actually saves a real combined CSV of what's checked. There is
// no server-side report history table in the real backend, so past
// downloads are never listed as if they were saved server-side -- each
// download is a fresh, real export of current data, not a fabricated
// history.
export function ReportBuilder({ sections }: { sections: ReportSection[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.key, s.key === "occupancy" || s.key === "fees"])),
  );
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(todayIso());
  const [notice, setNotice] = useState<string | undefined>();

  const pickedCount = useMemo(() => Object.values(checked).filter(Boolean).length, [checked]);

  function download() {
    if (pickedCount === 0) return setNotice("Pick at least one section to include in the report.");
    if (!from || !to || from > to) return setNotice("Choose a valid start and end date.");
    setNotice(undefined);

    const lines: string[] = [`Hostel report,${from} to ${to}`, ""];
    for (const s of sections) {
      if (!checked[s.key]) continue;
      lines.push(s.label);
      lines.push(toCsv(s.rows));
      lines.push("");
    }
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hostel-report-${from}-to-${to}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Card style={{ padding: "20px 22px" }}>
      <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Build a report</h2>
      <p style={{ margin: "4px 0 16px", fontSize: 12.5, color: "var(--hw-text-muted)" }}>
        Pick what to include. Every section reflects the current, real data for this hostel.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {sections.map((s) => (
          <label
            key={s.key}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: "12px 14px",
              borderRadius: 10,
              border: `1px solid ${checked[s.key] ? "var(--hw-accent)" : "var(--hw-divider)"}`,
              background: checked[s.key] ? "var(--hw-accent-100)" : "#fff",
              cursor: "pointer",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={!!checked[s.key]}
                onChange={(e) => setChecked((prev) => ({ ...prev, [s.key]: e.target.checked }))}
              />
              <span style={{ fontWeight: 700, fontSize: 13.5 }}>{s.label}</span>
            </span>
            <span style={{ fontSize: 11.5, color: "var(--hw-text-muted)" }}>{s.note}</span>
          </label>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
          Start date
          <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ height: 34, width: 150 }} />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
          End date
          <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ height: 34, width: 150 }} />
        </label>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--hw-text-faint)" }}>{pickedCount} section(s) selected</span>
        <PrimaryButton type="button" onClick={download} style={{ height: 36, padding: "0 18px" }}>
          Download report
        </PrimaryButton>
      </div>
      {notice && (
        <p role="alert" style={{ margin: "12px 0 0", padding: "10px 14px", borderRadius: 9, background: "var(--hw-red-bg)", color: "var(--hw-red-text)", fontSize: 13, fontWeight: 600 }}>
          {notice}
        </p>
      )}
    </Card>
  );
}
