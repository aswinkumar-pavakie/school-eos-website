"use client";

import { useState, useTransition } from "react";
import { HostelWardenModal } from "@/components/hostel-warden-ui/Modal";
import { GhostButton, PrimaryButton, SecondaryButton, TextArea } from "@/components/hostel-warden-ui/primitives";
import { useFlash } from "@/components/hostel-warden-ui/FlashContext";
import { approveOutingRequestAction, rejectOutingRequestAction, type OutingKind } from "./actions";

export function DecisionButtons({ id, kind, studentName }: { id: string; kind: OutingKind; studentName: string }) {
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const { showFlash } = useFlash();

  function close() {
    setMode(null);
    setComment("");
    setError(undefined);
  }

  function submit() {
    if (mode === "reject" && comment.trim() === "") {
      setError("A reason is required to reject this request.");
      return;
    }
    startTransition(async () => {
      setError(undefined);
      try {
        if (mode === "approve") {
          await approveOutingRequestAction(kind, id, comment.trim() || undefined);
          showFlash(`Approved -- ${studentName}'s request is now on the gate register.`);
        } else if (mode === "reject") {
          await rejectOutingRequestAction(kind, id, comment.trim());
          showFlash(`Rejected -- ${studentName} was not granted this request.`);
        }
        close();
      } catch (err) {
        setError(err instanceof Error ? err.message : "That didn't work. Please try again.");
      }
    });
  }

  return (
    <>
      <span style={{ display: "inline-flex", gap: 8 }}>
        <PrimaryButton type="button" style={{ height: 30, fontSize: 12, padding: "0 12px" }} onClick={() => setMode("approve")}>
          Approve
        </PrimaryButton>
        <SecondaryButton type="button" style={{ height: 30, fontSize: 12, padding: "0 12px" }} onClick={() => setMode("reject")}>
          Reject
        </SecondaryButton>
      </span>

      <HostelWardenModal open={mode !== null} onClose={close} title={mode === "approve" ? "Approve request" : "Reject request"} width={480}>
        <div style={{ padding: "18px 22px 4px", fontSize: 14, color: "var(--hw-text-muted)" }}>
          {mode === "approve"
            ? `${studentName}'s request will be approved and added to the gate register.`
            : `${studentName} will not be granted this request. A reason is required so the parent can be informed.`}
        </div>
        <div style={{ padding: "12px 22px 0" }}>
          <TextArea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={mode === "approve" ? "Note for the record (optional)" : "Reason for rejection"}
            style={{ width: "100%" }}
          />
        </div>
        {error && (
          <p role="alert" style={{ margin: "10px 22px 0", padding: "10px 14px", borderRadius: 9, background: "var(--hw-red-bg)", color: "var(--hw-red-text)", fontSize: 13, fontWeight: 600 }}>
            {error}
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "18px 22px 22px" }}>
          <GhostButton type="button" onClick={close} disabled={pending} style={{ height: 32, fontSize: 12.5 }}>
            Cancel
          </GhostButton>
          <PrimaryButton
            type="button"
            disabled={pending}
            onClick={submit}
            style={{ height: 32, fontSize: 12.5, opacity: pending ? 0.7 : 1, ...(mode === "reject" ? { background: "var(--hw-red-strong)" } : {}) }}
          >
            {pending ? "Working…" : mode === "approve" ? "Approve" : "Reject"}
          </PrimaryButton>
        </div>
      </HostelWardenModal>
    </>
  );
}
