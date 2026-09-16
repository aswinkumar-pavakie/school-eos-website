"use client";

// The design's own "Collect" button -> real sendFineToFinanceAction (see
// page.tsx's own comment for why: there is no direct cash-collect action in
// this system, Finance owns that). A "Waive" link is real, necessary
// functionality the design doesn't picture but this screen would otherwise
// have no way to reach at all (the old, more general /library/fines page
// this route replaces did have it) -- kept small and secondary rather than
// matching the "Collect" button's own weight.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendFineToFinanceAction, waiveFineAction } from "./actions";
import { ConfirmAction } from "@/components/library-ui/ConfirmModal";
import { LibraryModal } from "@/components/library-ui/Modal";
import { SecondaryButton } from "@/components/library-ui/primitives";
import { useLibraryToast } from "@/components/library-ui/toast/ToastProvider";
import type { LibraryFine } from "@/lib/library-api";

export function FineRowAction({ fine }: { fine: LibraryFine }) {
  const router = useRouter();
  const toast = useLibraryToast();
  const [waiveOpen, setWaiveOpen] = useState(false);

  if (fine.status !== "PENDING") {
    return (
      <span style={{ font: "400 13px/1.3 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
        {fine.status === "SENT_TO_FINANCE" ? "Sent to Finance" : "Partially paid"}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
      <button type="button" onClick={() => setWaiveOpen(true)} style={{ border: 0, background: "none", cursor: "pointer", font: "500 13px/1.2 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
        Waive
      </button>
      <ConfirmAction
        title="Send to Finance"
        body={`Send this fine to Finance for collection from ${fine.memberName}?`}
        cta="Send to Finance"
        onConfirm={async () => {
          await sendFineToFinanceAction(fine.id);
          toast.show("Sent to Finance for collection");
          router.refresh();
        }}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            className="lib-btn-primary"
            style={{ padding: "10px 24px", border: 0, borderRadius: 9, background: "var(--lib-navy)", color: "#fff", font: "600 14px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
          >
            Collect
          </button>
        )}
      />

      <WaiveModal
        open={waiveOpen}
        onClose={() => setWaiveOpen(false)}
        onWaive={async (reason) => {
          const fd = new FormData();
          fd.set("reason", reason);
          const result = await waiveFineAction(fine.id, {}, fd);
          if (result.error) throw new Error(result.error);
          toast.show("Fine waived");
          router.refresh();
        }}
      />
    </div>
  );
}

function WaiveModal({ open, onClose, onWaive }: { open: boolean; onClose: () => void; onWaive: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  return (
    <LibraryModal open={open} onClose={onClose} title="Waive fine" width={480}>
      <form
        action={async () => {
          if (!reason.trim()) return;
          setPending(true);
          setError(undefined);
          try {
            await onWaive(reason.trim());
            onClose();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Waive failed.");
          } finally {
            setPending(false);
          }
        }}
        style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", gap: 8 }}
      >
        {error && (
          <p role="alert" style={{ padding: "10px 14px", borderRadius: 11, background: "var(--lib-red-bg)", color: "var(--lib-red)", font: "500 14px/1.4 var(--lib-font-sans)" }}>
            {error}
          </p>
        )}
        <label htmlFor="waive-reason" style={{ font: "600 14px/1.2 var(--lib-font-sans)", color: "var(--lib-primary)" }}>
          Reason
        </label>
        <input
          id="waive-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={pending}
          required
          style={{ padding: "13px 15px", border: "1px solid var(--lib-field-border)", borderRadius: 10, font: "400 15px/1.2 var(--lib-font-sans)" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 18 }}>
          <SecondaryButton type="button" onClick={onClose} disabled={pending}>
            Cancel
          </SecondaryButton>
          <button
            type="submit"
            disabled={pending || !reason.trim()}
            style={{ padding: "12px 28px", border: "1px solid var(--lib-red-border)", borderRadius: 10, background: "var(--lib-white)", color: "var(--lib-red)", font: "600 15px/1.2 var(--lib-font-sans)", cursor: "pointer", opacity: pending ? 0.7 : 1 }}
          >
            {pending ? "Waiving…" : "Confirm waive"}
          </button>
        </div>
      </form>
    </LibraryModal>
  );
}
