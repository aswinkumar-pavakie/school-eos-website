"use client";

import { useEffect, type ReactNode } from "react";
import { CloseXIcon } from "./icons";

// Matches the design's overlay pattern exactly: rgba(15,23,42,.35) scrim,
// centered white 16px-radius panel, box-shadow 0 24px 60px rgba(15,23,42,.22),
// a sticky title/close header (22px/28px padding, 21px/600 title, 34x34
// bordered close button). Width varies per modal in the source (560/600/
// 760/860) -- passed in by each caller rather than hardcoded here.
export function LibraryModal({
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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background: "var(--lib-scrim)",
        display: "grid",
        placeItems: "center",
        padding: 24,
        overflowY: "auto",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: width,
          background: "var(--lib-white)",
          borderRadius: "var(--lib-radius-modal)",
          boxShadow: "var(--lib-shadow-modal)",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "22px 28px",
            background: "var(--lib-white)",
            borderBottom: "1px solid var(--lib-divider)",
          }}
        >
          <div style={{ flex: 1, font: "600 21px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="lib-surface-hover"
            style={{
              width: 34,
              height: 34,
              border: "1px solid var(--lib-border)",
              borderRadius: 9,
              background: "var(--lib-white)",
              color: "var(--lib-body-muted)",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <CloseXIcon size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
