"use client";

// The design's own "PDF"/"Excel" buttons -- no real backend generates either
// for these 6 composed reports (the CSV export routes that DO exist cover a
// different, narrower shape -- see Member activity / Transaction history).
// Wired to an honest explainer rather than a broken or mismatched download.

import { useState } from "react";
import { LibraryModal } from "@/components/library-ui/Modal";
import { SecondaryButton } from "@/components/library-ui/primitives";

export function ExportButtons() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lib-surface-hover"
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", border: "1px solid var(--lib-border)", borderRadius: 10, background: "var(--lib-white)", color: "var(--lib-ink)", font: "500 15px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
      >
        PDF
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lib-surface-hover"
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", border: "1px solid var(--lib-border)", borderRadius: 10, background: "var(--lib-white)", color: "var(--lib-ink)", font: "500 15px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
      >
        Excel
      </button>
      <LibraryModal open={open} onClose={() => setOpen(false)} title="Export" width={440}>
        <div style={{ padding: "0 28px 8px", font: "400 16px/1.6 var(--lib-font-sans)", color: "var(--lib-body)" }}>
          PDF/Excel export for this report isn’t wired up yet. Member activity and Transaction history (in the list on the left) already export as CSV.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "24px 28px 28px" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>
            Got it
          </SecondaryButton>
        </div>
      </LibraryModal>
    </>
  );
}
