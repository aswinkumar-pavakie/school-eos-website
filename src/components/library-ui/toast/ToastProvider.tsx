"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

// The design's single feedback mechanism for every write action (flash(text)
// in the .dc.html's own Component class): a bottom-center dark pill,
// auto-dismissed after 2.2s (the source's own setTimeout(...,2200)). Mounted
// once by LibraryShell; call useLibraryToast().show(message) after a
// successful useActionState transition.
const ToastContext = createContext<{ show: (message: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    timerRef.current = setTimeout(() => setMessage(null), 2200);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 32,
            transform: "translateX(-50%)",
            zIndex: 90,
            padding: "14px 24px",
            borderRadius: 12,
            background: "var(--lib-ink)",
            color: "#fff",
            font: "500 15px/1.3 var(--lib-font-sans)",
            boxShadow: "var(--lib-shadow-toast)",
            whiteSpace: "nowrap",
          }}
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useLibraryToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useLibraryToast must be used within a LibraryShell (ToastProvider)");
  return ctx;
}
