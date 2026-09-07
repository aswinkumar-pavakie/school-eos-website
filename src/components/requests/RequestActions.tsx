"use client";

// Pending/Resubmitted -> Approve / Reject / Send Back. Sent Back -> Resubmit.
// Nothing offered once Approved/Rejected -- those are terminal here (Admin
// isn't allowed to un-decide a request just because it can technically be
// viewed).

import { useActionState, useState } from "react";
import {
  approveApprovalRequestAction,
  rejectApprovalRequestAction,
  resubmitApprovalRequestAction,
  sendBackApprovalRequestAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/requests/actions";
import { TextAreaField } from "@/components/dashboard/FormFields";

const initialState: FormActionState = {};

type ActionKey = "approve" | "reject" | "sendback" | "resubmit" | null;

export function RequestActions({ requestId, state }: { requestId: string; state: string }) {
  const [open, setOpen] = useState<ActionKey>(null);
  const toggle = (key: ActionKey) => setOpen((v) => (v === key ? null : key));

  if (state === "SENT_BACK") {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => toggle("resubmit")}
          className="self-start rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white"
        >
          Resubmit
        </button>
        {open === "resubmit" && <ResubmitForm requestId={requestId} onDone={() => setOpen(null)} />}
      </div>
    );
  }

  if (!["PENDING", "RESUBMITTED"].includes(state)) {
    return <p className="text-sm text-text-muted">This request is {state.toLowerCase()} -- no further actions are available.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => toggle("approve")} className="rounded-[11px] bg-primary px-3.5 py-2 text-[13px] font-bold text-white">
          Approve
        </button>
        <button type="button" onClick={() => toggle("reject")} className="rounded-[11px] border border-border px-3.5 py-2 text-[13px] font-semibold text-critical-text hover:bg-field">
          Reject
        </button>
        <button type="button" onClick={() => toggle("sendback")} className="rounded-[11px] border border-border px-3.5 py-2 text-[13px] font-semibold text-text hover:bg-field">
          Send back
        </button>
      </div>

      {open === "approve" && <CommentForm requestId={requestId} action={approveApprovalRequestAction} label="Approve this request" submitLabel="Approve" onDone={() => setOpen(null)} />}
      {open === "reject" && <CommentForm requestId={requestId} action={rejectApprovalRequestAction} label="Reject this request" submitLabel="Reject" onDone={() => setOpen(null)} critical />}
      {open === "sendback" && (
        <CommentForm
          requestId={requestId}
          action={sendBackApprovalRequestAction}
          label="What does the requester need to fix? *"
          submitLabel="Send back"
          onDone={() => setOpen(null)}
          required
        />
      )}
    </div>
  );
}

function CommentForm({
  requestId,
  action,
  label,
  submitLabel,
  onDone,
  required,
  critical,
}: {
  requestId: string;
  action: (id: string, prev: FormActionState, formData: FormData) => Promise<FormActionState>;
  label: string;
  submitLabel: string;
  onDone: () => void;
  required?: boolean;
  critical?: boolean;
}) {
  const bound = action.bind(null, requestId);
  const [state, formAction, isPending] = useActionState(bound, initialState);
  return (
    <form action={(fd) => { formAction(fd); onDone(); }} className="flex flex-col gap-2.5 rounded-[11px] bg-field p-3.5">
      {state.error && <span className="text-xs text-critical-text">{state.error}</span>}
      <TextAreaField label={label} name="comment" required={required} disabled={isPending} rows={2} />
      <button
        type="submit"
        disabled={isPending}
        className={`self-start rounded-[11px] px-3.5 py-2 text-sm font-bold disabled:opacity-60 ${
          critical ? "bg-critical-bg text-critical-text" : "bg-primary text-white"
        }`}
      >
        {isPending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function ResubmitForm({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const action = resubmitApprovalRequestAction.bind(null, requestId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={(fd) => { formAction(fd); onDone(); }} className="flex flex-col gap-2.5 rounded-[11px] bg-field p-3.5">
      {state.error && <span className="text-xs text-critical-text">{state.error}</span>}
      <TextAreaField label="Updated description (optional)" name="description" disabled={isPending} rows={2} />
      <TextAreaField label="Note for the approver (optional)" name="comment" disabled={isPending} rows={2} />
      <button type="submit" disabled={isPending} className="self-start rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
        {isPending ? "Resubmitting…" : "Resubmit"}
      </button>
    </form>
  );
}
