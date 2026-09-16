"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckIcon, CloseXIcon } from "./icons";

interface FlashContextValue {
  showFlash: (message: string) => void;
}

const FlashContext = createContext<FlashContextValue | null>(null);

// Mirrors the design's own `note()` helper exactly: every write action in the
// source sets one shared `flash` string, rendered as a single dismissible
// banner directly under the header -- not a bottom toast stack. Re-showing
// the same text still re-triggers (the `id` counter forces a fresh render).
export function FlashProvider({ children }: { children: ReactNode }) {
  const [entry, setEntry] = useState<{ id: number; message: string } | null>(null);

  const showFlash = useCallback((message: string) => {
    setEntry((prev) => ({ id: (prev?.id ?? 0) + 1, message }));
  }, []);

  const value = useMemo(() => ({ showFlash }), [showFlash]);

  return (
    <FlashContext.Provider value={value}>
      {children}
      {entry && (
        <div
          key={entry.id}
          role="status"
          style={{
            margin: "18px 32px -6px",
            border: "1px solid var(--hw-accent-300)",
            background: "var(--hw-accent-100)",
            borderRadius: "var(--hw-radius-sm)",
            padding: "10px 14px",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckIcon />
          <span style={{ flex: 1, color: "var(--hw-accent-900)" }}>{entry.message}</span>
          <button
            type="button"
            onClick={() => setEntry(null)}
            aria-label="Dismiss"
            style={{
              all: "unset",
              cursor: "pointer",
              color: "var(--hw-accent-700)",
              display: "grid",
              placeItems: "center",
              padding: "0 2px",
            }}
          >
            <CloseXIcon size={15} />
          </button>
        </div>
      )}
    </FlashContext.Provider>
  );
}

export function useFlash(): FlashContextValue {
  const ctx = useContext(FlashContext);
  if (!ctx) throw new Error("useFlash must be used inside FlashProvider (HostelWardenShell mounts it once)");
  return ctx;
}
