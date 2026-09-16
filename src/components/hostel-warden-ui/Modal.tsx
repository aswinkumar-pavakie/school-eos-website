"use client";

import { useEffect, type ReactNode } from "react";
import { CloseXIcon } from "./icons";

// Matches the design's own modal chrome (16px radius panel, sticky
// title/close header) as closely as the source's plain sections allow --
// the design itself never shows a modal (all its forms are inline
// <section class="card">), so this borrows the same shell every other
// rebuilt role uses for its own inline-form-turned-modal cases.
export function HostelWardenModal({
  open,
  onClose,
  title,
  width = 560,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(16,35,63,.35)", display: "grid", placeItems: "center", padding: 24, overflowY: "auto" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: width,
          background: "var(--hw-surface)",
          borderRadius: "var(--hw-radius-md)",
          boxShadow: "0 24px 60px rgba(16,35,63,.22)",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div style={{ position: "sticky", top: 0, display: "flex", alignItems: "center", gap: 16, padding: "18px 22px", background: "var(--hw-surface)", borderBottom: "1px solid var(--hw-divider)" }}>
          <div style={{ flex: 1, fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em", color: "var(--hw-text)" }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hw-surface-hover"
            style={{ width: 32, height: 32, border: "1px solid var(--hw-divider)", borderRadius: 8, background: "var(--hw-surface)", color: "#475569", cursor: "pointer", display: "grid", placeItems: "center" }}
          >
            <CloseXIcon size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
