"use client";

import { useState } from "react";
import { FacultyModal } from "@/components/faculty-ui/Modal";
import { useFacultyToast } from "@/components/faculty-ui/toast/ToastProvider";
import { rejectAction } from "./actions";

// Pixel-rebuilt reject flow -- reuses the EXISTING rejectAction server action
// unchanged (rejects always require a reason, same as before), only the
// modal chrome is new.
//
// Calls the action directly from a plain async submit handler (rather than
// wiring it through useActionState + an effect) so closing the modal and
// toasting on success are both ordinary setState calls inside an event
// handler -- no useEffect, no ref access during render. This repo's lint
// config (react-hooks/set-state-in-effect, react-hooks/refs) forbids both of
// those, so this is the compliant shape for "do something after an async
// action succeeds," not a stylistic choice.
export function FacultyRejectModal({ approvalRequestId }: { approvalRequestId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const toast = useFacultyToast();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(undefined);
    const result = await rejectAction(approvalRequestId, {}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.show("Leave request rejected");
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fac-hover-lift"
        style={{ flex: 1, border: "1px solid var(--fac-border)", background: "var(--fac-white)", color: "var(--fac-body)", cursor: "pointer", font: "600 14.5px/1 var(--fac-font-sans)", borderRadius: 10, padding: 13 }}
      >
        Reject
      </button>
      <FacultyModal open={open} onClose={() => setOpen(false)} title="Reject leave request" width={440}>
        <form action={handleSubmit} className="flex flex-col gap-3.5" style={{ marginTop: 18 }}>
          <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)" }}>REASON</div>
          <textarea
            name="comment"
            rows={3}
            required
            placeholder="Why is this being rejected?"
            style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1.6 var(--fac-font-sans)", resize: "vertical" }}
          />
          {error && <span style={{ font: "400 12px/1.3 var(--fac-font-sans)", color: "var(--fac-red-text)" }}>{error}</span>}
          <button
            type="submit"
            disabled={pending}
            style={{ border: 0, cursor: "pointer", borderRadius: 11, padding: 15, font: "600 15.5px/1 var(--fac-font-sans)", color: "#fff", background: "var(--fac-red)", opacity: pending ? 0.7 : 1 }}
          >
            {pending ? "Rejecting…" : "Reject request"}
          </button>
        </form>
      </FacultyModal>
    </>
  );
}
