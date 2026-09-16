"use client";

// The design's own "Send overdue reminders" button -- there is no real
// backend action for this anywhere (confirmed: no endpoint on the
// circulation/fines controllers). Kept visible, wired to an honest
// explainer instead of a no-op fake send.

import { useState } from "react";
import { LibraryModal } from "@/components/library-ui/Modal";
import { SecondaryButton } from "@/components/library-ui/primitives";

export function SendRemindersButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lib-surface-hover"
        style={{ padding: "14px 24px", border: "1px solid var(--lib-border)", borderRadius: 11, background: "var(--lib-white)", color: "var(--lib-ink)", font: "500 16px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
      >
        Send overdue reminders
      </button>
      <LibraryModal open={open} onClose={() => setOpen(false)} title="Send overdue reminders" width={480}>
        <div style={{ padding: "0 28px 8px", font: "400 16px/1.6 var(--lib-font-sans)", color: "var(--lib-body)" }}>
          Automatic reminders aren’t wired up yet — reach out to a class teacher directly for now.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "24px 28px 28px" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>
            Got it
          </SecondaryButton>
        </div>
      </LibraryModal>
    </>
  );
}
