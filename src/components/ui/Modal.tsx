"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Component #13 — modal: the web equivalent of the mobile bottom sheet, 480px wide,
// same field rhythm. One primary action per form (enforced by callers, not this
// component). Uses <dialog> for built-in focus-trap/backdrop/Esc-to-close.
export function Modal({
  trigger,
  title,
  children,
  defaultOpen,
}: {
  trigger: ReactNode;
  title: string;
  children: ReactNode;
  /** Opens automatically on mount — e.g. arriving via a "?studentId=" deep link from another page's Quick Action. */
  defaultOpen?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (defaultOpen) ref.current?.showModal();
    // Only ever auto-open once, on the page navigation that carried the flag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <span onClick={() => ref.current?.showModal()}>{trigger}</span>
      <dialog
        ref={ref}
        className="m-auto w-[480px] max-w-[calc(100vw-32px)] rounded-[var(--radius-sheet)] border border-border bg-surface p-0 backdrop:bg-[rgba(16,24,40,0.45)]"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-extrabold text-text">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => ref.current?.close()}
            className="rounded-full p-1 text-text-muted hover:bg-field"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </dialog>
    </>
  );
}
