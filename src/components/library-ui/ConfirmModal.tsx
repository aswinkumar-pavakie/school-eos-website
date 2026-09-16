"use client";

import { useState, useTransition, type ReactNode } from "react";
import { LibraryModal } from "./Modal";
import { SecondaryButton } from "./primitives";

// Ports the design's own ask(title, body, cta, danger, run) helper as a real
// component: a trigger renders as `children`, clicking it opens a 560px
// confirm modal (title + body + Cancel/CTA), and `onConfirm` runs the real
// mutation. `danger` matches the source's own red-outline/red-text CTA vs
// solid navy CTA.
//
// `onConfirm` is caught HERE, centrally -- found live during production
// testing: a real backend business-rule rejection (e.g. "mark lost" 400s a
// copy with no recorded acquisition cost, since a fine amount can't be
// computed without one) was silently swallowed as an unhandled promise
// rejection inside startTransition, with nothing shown to the librarian and
// the modal just sitting there. Every ConfirmAction call site in this
// rebuild (Return/Renew/Damaged/Lost, Collect, Withdraw, Deactivate/
// Activate) gets a real, visible error message and a modal that stays open
// to show it, from this one fix.
export function ConfirmAction({
  trigger,
  title,
  body,
  cta,
  danger,
  onConfirm,
}: {
  trigger: (open: () => void) => ReactNode;
  title: string;
  body: string;
  cta: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setError(undefined);
  }

  return (
    <>
      {trigger(() => setOpen(true))}
      <LibraryModal open={open} onClose={close} title={title} width={560}>
        <div style={{ padding: "0 26px 8px", font: "400 16px/1.6 var(--lib-font-sans)", color: "var(--lib-body)" }}>{body}</div>
        {error && (
          <p role="alert" style={{ margin: "0 26px 8px", padding: "10px 14px", borderRadius: 11, background: "var(--lib-red-bg)", color: "var(--lib-red)", font: "500 14px/1.4 var(--lib-font-sans)" }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "24px 26px 26px" }}>
          <SecondaryButton type="button" onClick={close} disabled={pending}>
            Cancel
          </SecondaryButton>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(undefined);
                try {
                  await onConfirm();
                  close();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "That didn't work. Please try again.");
                }
              })
            }
            style={{
              padding: "12px 28px",
              borderRadius: 10,
              cursor: "pointer",
              font: "600 15px/1.2 var(--lib-font-sans)",
              border: danger ? "1px solid var(--lib-red-border)" : "1px solid var(--lib-navy)",
              background: danger ? "var(--lib-white)" : "var(--lib-navy)",
              color: danger ? "var(--lib-red)" : "#fff",
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? "Working…" : cta}
          </button>
        </div>
      </LibraryModal>
    </>
  );
}
