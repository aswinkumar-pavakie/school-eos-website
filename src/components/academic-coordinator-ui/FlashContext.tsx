"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CloseXIcon } from "./icons";

interface FlashContextValue {
  showFlash: (message: string) => void;
}

const FlashContext = createContext<FlashContextValue | null>(null);

// A single dismissible banner for write-action feedback, matching every
// other rebuilt role's own flash pattern in this app (see hostel-warden-ui/
// FlashContext.tsx) -- the design itself has no toast system of its own for
// most of these screens, so this fills that real UX need without inventing
// fake data.
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
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100,
            background: "var(--acc-navy)",
            color: "#fff",
            borderRadius: 12,
            padding: "12px 18px",
            fontSize: 13.5,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: "min(90vw, 480px)",
            boxShadow: "0 18px 40px rgba(15,23,42,.25)",
          }}
        >
          <span style={{ flex: 1 }}>{entry.message}</span>
          <button
            type="button"
            onClick={() => setEntry(null)}
            aria-label="Dismiss"
            style={{ all: "unset", cursor: "pointer", color: "#fff", opacity: 0.8, display: "grid", placeItems: "center" }}
          >
            <CloseXIcon size={14} />
          </button>
        </div>
      )}
    </FlashContext.Provider>
  );
}

export function useFlash(): FlashContextValue {
  const ctx = useContext(FlashContext);
  if (!ctx) throw new Error("useFlash must be used inside FlashProvider (AcademicCoordinatorShell mounts it once)");
  return ctx;
}
