"use client";

import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "./icons";

// Controlled modal (opened from the topbar / other screens, not always from
// an inline trigger) -- matches the design's overlay pattern exactly: a
// rgba(15,23,42,.45) scrim + centered white 16px-radius panel with a
// title/subtitle/close header. Used by New homework, Current unit, Messages,
// and Notice-post overlays.
export function FacultyModal({
  open,
  onClose,
  title,
  subtitle,
  width = 560,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "var(--fac-scrim)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 36,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width,
          maxWidth: "100%",
          maxHeight: "100%",
          overflow: "auto",
          background: "var(--fac-white)",
          borderRadius: "var(--fac-radius-modal)",
          padding: 26,
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div style={{ font: "700 24px/1.2 var(--fac-font-sans)" }}>{title}</div>
            {subtitle && (
              <div style={{ font: "400 14px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 4 }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              border: "1px solid var(--fac-border)",
              background: "var(--fac-white)",
              borderRadius: "var(--fac-radius-btn-sm)",
              cursor: "pointer",
              color: "var(--fac-body-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
