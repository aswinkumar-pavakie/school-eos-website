"use client";

import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "./icons";

// Controlled modal -- same overlay pattern as faculty-ui/Modal.tsx (a scrim
// + centered white rounded panel with a title/close header), on the
// --can-* token set so it matches the rest of this portal.
export function CanteenModal({
  open,
  onClose,
  title,
  subtitle,
  width = 480,
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
        background: "var(--can-scrim)",
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
          background: "var(--can-white)",
          borderRadius: "var(--can-radius-modal)",
          padding: 26,
          boxShadow: "0 24px 60px rgba(15,23,42,.22)",
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div style={{ font: "700 20px/1.2 var(--can-font-sans)", color: "var(--can-ink)" }}>{title}</div>
            {subtitle && (
              <div style={{ font: "400 13.5px/1.4 var(--can-font-sans)", color: "var(--can-body-muted)", marginTop: 4 }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              border: "1px solid var(--can-border)",
              background: "var(--can-white)",
              borderRadius: "var(--can-radius-btn-sm)",
              cursor: "pointer",
              color: "var(--can-body-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
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
