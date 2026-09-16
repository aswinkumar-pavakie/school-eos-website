"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendFineToFinanceAction } from "../fines/actions";
import { ConfirmAction } from "@/components/library-ui/ConfirmModal";
import { LibraryModal } from "@/components/library-ui/Modal";
import { SecondaryButton } from "@/components/library-ui/primitives";
import { useLibraryToast } from "@/components/library-ui/toast/ToastProvider";
import type { LibraryLostDamagedReport } from "@/lib/library-api";

export function LostDamagedRowAction({ report }: { report: LibraryLostDamagedReport }) {
  const router = useRouter();
  const toast = useLibraryToast();
  const [replaceOpen, setReplaceOpen] = useState(false);

  return (
    <div style={{ display: "inline-flex", gap: 10 }}>
      {report.fineId && report.fineStatus === "PENDING" ? (
        <ConfirmAction
          title="Send to Finance"
          body={`Send this charge to Finance for collection${report.memberName ? ` from ${report.memberName}` : ""}?`}
          cta="Send to Finance"
          onConfirm={async () => {
            await sendFineToFinanceAction(report.fineId!);
            toast.show("Sent to Finance for collection");
            router.refresh();
          }}
          trigger={(open) => (
            <button
              type="button"
              onClick={open}
              className="lib-btn-primary"
              style={{ padding: "10px 22px", border: 0, borderRadius: 9, background: "var(--lib-navy)", color: "#fff", font: "600 14px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
            >
              Collect
            </button>
          )}
        />
      ) : (
        <span style={{ font: "400 13px/1.3 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
          {report.fineId ? "Sent to Finance" : "No charge"}
        </span>
      )}
      <button
        type="button"
        onClick={() => setReplaceOpen(true)}
        className="lib-surface-hover"
        style={{ padding: "10px 22px", border: "1px solid var(--lib-border)", borderRadius: 9, background: "var(--lib-white)", color: "var(--lib-ink)", font: "500 14px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
      >
        Replacement
      </button>
      <LibraryModal open={replaceOpen} onClose={() => setReplaceOpen(false)} title="Accept a replacement copy" width={480}>
        <div style={{ padding: "0 28px 8px", font: "400 16px/1.6 var(--lib-font-sans)", color: "var(--lib-body)" }}>
          Accepting a physical replacement in place of a charge isn’t wired up yet — for now, add the replacement copy to the catalogue directly (Books → the title → Add copy) and waive this charge from Overdue &amp; fines.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "24px 28px 28px" }}>
          <SecondaryButton type="button" onClick={() => setReplaceOpen(false)}>
            Got it
          </SecondaryButton>
        </div>
      </LibraryModal>
    </div>
  );
}
