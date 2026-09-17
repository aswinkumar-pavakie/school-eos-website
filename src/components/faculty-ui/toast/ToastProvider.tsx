"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

// The design's single feedback mechanism for every write action (~30 call
// sites): a bottom-center dark pill, auto-dismissed after 2.6s. Mounted once
// by FacultyShell; call useFacultyToast().show(message) from a client wrapper
// after a successful useActionState transition (same shape
// CreateFacultyModal.tsx already establishes for watching action results).
const ToastContext = createContext<{ show: (message: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    timerRef.current = setTimeout(() => setMessage(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 34,
            transform: "translateX(-50%)",
            zIndex: 90,
            background: "var(--fac-ink)",
            color: "#fff",
            borderRadius: 11,
            padding: "14px 24px",
            font: "500 14.5px/1 var(--fac-font-sans)",
            whiteSpace: "nowrap",
          }}
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useFacultyToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useFacultyToast must be used within a FacultyShell (ToastProvider)");
  return ctx;
}
