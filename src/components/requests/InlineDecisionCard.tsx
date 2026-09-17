"use client";

// Approve / Reject / Send back, straight from the list card -- per the
// mockup's isApprovals design for the buttons themselves, extended with a
// real interaction: clicking Reject or Send back hides all three buttons and
// swaps in a single text input + Submit/Cancel, since both those decisions
// take a reason on the real backend (required on Principal's /approvals
// module always; required only for Send back on Admin's /approval-requests
// module -- Admin's own Reject is genuinely optional there, but still gets
// the same input-box interaction for a consistent, predictable UI, it just
// doesn't block submission on an empty reason). Approve stays a single click
// -- its comment is optional on both real backends, so a plain click is
// real, not a stub.

import { useRef, useState, useTransition } from "react";

export interface InlineDecisionState {
  error?: string;
}

type PendingMode = "reject" | "sendback";

export function InlineDecisionCard({
  approveAction,
  rejectAction,
  sendBackAction,
  rejectRequiresComment = true,
  sendBackRequiresComment = true,
}: {
  approveAction: (formData: FormData) => Promise<InlineDecisionState>;
  rejectAction: (formData: FormData) => Promise<InlineDecisionState>;
  sendBackAction: (formData: FormData) => Promise<InlineDecisionState>;
  /** Whether the real backend actually requires a reason for that decision --
   * Principal's /approvals module always does for both; Admin's
   * /approval-requests module only requires one for Send back, not Reject. */
  rejectRequiresComment?: boolean;
  sendBackRequiresComment?: boolean;
}) {
  const [mode, setMode] = useState<PendingMode | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function openMode(next: PendingMode) {
    setMode(next);
    setComment("");
    setError(undefined);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function cancel() {
    setMode(null);
    setComment("");
    setError(undefined);
  }

  function submitApprove() {
    setError(undefined);
    startTransition(async () => {
      const fd = new FormData();
      const result = await approveAction(fd);
      if (result.error) setError(result.error);
    });
  }

  function submitDecision() {
    const requiresComment = mode === "reject" ? rejectRequiresComment : sendBackRequiresComment;
    if (requiresComment && !comment.trim()) {
      setError(mode === "reject" ? "Reason · required" : "Reason/comment · required");
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("comment", comment.trim());
      const action = mode === "reject" ? rejectAction : sendBackAction;
      const result = await action(fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMode(null);
      setComment("");
    });
  }

  if (mode) {
    const label = mode === "reject" ? "Reject" : "Send back";
    const requiresComment = mode === "reject" ? rejectRequiresComment : sendBackRequiresComment;
    return (
      <div className="flex min-w-[260px] flex-col gap-2">
        <textarea
          ref={inputRef}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isPending}
          rows={2}
          placeholder={requiresComment ? `Reason for ${label.toLowerCase()} (required)` : `Reason for ${label.toLowerCase()} (optional)`}
          className="w-full resize-none rounded-[10px] border border-[#dfe5ef] bg-surface p-[12px] text-[14px] text-text outline-none focus:border-primary disabled:opacity-60"
        />
        {error && <p className="text-[12px] font-semibold text-critical-text">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={cancel}
            className="min-h-[38px] rounded-[10px] border border-border bg-surface px-4 text-[13px] font-semibold text-text transition-colors hover:bg-bg disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={submitDecision}
            className={`min-h-[38px] rounded-[10px] px-4 text-[13px] font-semibold text-white transition-colors disabled:opacity-60 ${
              mode === "reject" ? "bg-critical-text hover:opacity-90" : "bg-primary hover:bg-primary-deep"
            }`}
          >
            {isPending ? "Sending…" : label}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-start gap-[10px]">
        <button
          type="button"
          disabled={isPending}
          onClick={() => openMode("sendback")}
          className="min-h-[46px] whitespace-nowrap rounded-[10px] border border-border bg-surface px-[18px] text-[15px] font-semibold text-text transition-colors hover:bg-bg disabled:opacity-60"
        >
          Send back
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => openMode("reject")}
          className="min-h-[46px] whitespace-nowrap rounded-[10px] border border-border bg-surface px-[22px] text-[15px] font-semibold text-text transition-colors hover:bg-bg disabled:opacity-60"
        >
          Reject
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={submitApprove}
          className="min-h-[46px] whitespace-nowrap rounded-[10px] bg-primary px-6 text-[15px] font-semibold text-white transition-colors hover:bg-primary-deep disabled:opacity-60"
        >
          {isPending ? "Approving…" : "Approve"}
        </button>
      </div>
      {error && <p className="text-[12px] font-semibold text-critical-text">{error}</p>}
    </div>
  );
}
