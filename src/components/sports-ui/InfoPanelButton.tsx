"use client";

import { useState } from "react";
import { SecondaryButton } from "./primitives";

// For design buttons whose real content is institutional policy text, not a
// data query (e.g. "Points rules", "Care protocol") -- no backend table
// backs these (confirmed by direct schema audit before building this), so
// rather than fabricate a data-driven report behind them, this shows real,
// honestly-static reference text. Never used for anything that should be
// live data -- those get ExportCsvButton or a real panel instead.
export function InfoPanelButton({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <SecondaryButton type="button" onClick={() => setOpen((v) => !v)}>
        {label}
      </SecondaryButton>
      {open ? (
        <div
          style={{
            position: "absolute",
            zIndex: 20,
            top: "calc(100% + 8px)",
            right: 0,
            width: 340,
            background: "#fff",
            border: "1px solid var(--sport-border)",
            borderRadius: 12,
            padding: "16px 18px",
            boxShadow: "0 12px 32px rgba(16,35,59,0.16)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--sport-heading)" }}>{title}</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: "none", border: 0, cursor: "pointer", fontSize: 16, color: "var(--sport-tertiary)", lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--sport-body)" }}>{children}</div>
        </div>
      ) : null}
    </div>
  );
}
