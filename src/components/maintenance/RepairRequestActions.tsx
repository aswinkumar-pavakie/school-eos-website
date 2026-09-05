"use client";

// Requested -> Assigned -> In Progress -> Completed, plus Cancel. Only the
// action valid for the request's current status is ever offered.

import { useActionState, useState } from "react";
import {
  assignRepairRequestAction,
  cancelRepairRequestAction,
  completeRepairRequestAction,
  startRepairRequestAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/maintenance/actions";
import { PersonPicker } from "@/components/dashboard/PersonPicker";
import { TextAreaField } from "@/components/dashboard/FormFields";

const initialState: FormActionState = {};

interface Request {
  id: string;
  status: string;
}

type ActionKey = "assign" | "complete" | "cancel" | null;

export function RepairRequestActions({ request }: { request: Request }) {
  const [open, setOpen] = useState<ActionKey>(null);
  const toggle = (key: ActionKey) => setOpen((v) => (v === key ? null : key));
  const isOpenStatus = ["REQUESTED", "ASSIGNED", "IN_PROGRESS"].includes(request.status);

  if (!isOpenStatus) {
    return <p className="text-sm text-text-muted">This request is {request.status.toLowerCase()} -- no further actions are available.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => toggle("assign")} className="rounded-[11px] border border-border px-3.5 py-2 text-[13px] font-semibold text-text hover:bg-field">
          {request.status === "REQUESTED" ? "Assign" : "Reassign"}
        </button>
        {request.status === "ASSIGNED" && <StartButton requestId={request.id} />}
        <button type="button" onClick={() => toggle("complete")} className="rounded-[11px] bg-primary px-3.5 py-2 text-[13px] font-bold text-white">
          Mark completed
        </button>
        <button type="button" onClick={() => toggle("cancel")} className="rounded-[11px] border border-border px-3.5 py-2 text-[13px] font-semibold text-critical-text hover:bg-field">
          Cancel request
        </button>
      </div>

      {open === "assign" && <AssignForm requestId={request.id} onDone={() => setOpen(null)} />}
      {open === "complete" && <CompleteForm requestId={request.id} onDone={() => setOpen(null)} />}
      {open === "cancel" && <CancelForm requestId={request.id} onDone={() => setOpen(null)} />}
    </div>
  );
}

function StartButton({ requestId }: { requestId: string }) {
  const [isPending, setIsPending] = useState(false);
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        setIsPending(true);
        startRepairRequestAction(requestId).finally(() => setIsPending(false));
      }}
      className="rounded-[11px] border border-border px-3.5 py-2 text-[13px] font-semibold text-text hover:bg-field disabled:opacity-60"
    >
      {isPending ? "Starting…" : "Start work"}
    </button>
  );
}

function AssignForm({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const [person, setPerson] = useState<{ id: string } | null>(null);
  const action = assignRepairRequestAction.bind(null, requestId, person?.id ?? "");
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={(fd) => { formAction(fd); onDone(); }} className="flex flex-col gap-2.5 rounded-[11px] bg-field p-3.5">
      {state.error && <span className="text-xs text-critical-text">{state.error}</span>}
      <div className="flex flex-wrap items-end gap-2.5">
        <PersonPicker label="Assign to *" disabled={isPending} onSelect={setPerson} />
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Assigned on</span>
          <input name="assignedOn" type="date" disabled={isPending} className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
        </label>
        <button type="submit" disabled={isPending || !person} className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
          {isPending ? "Saving…" : "Assign"}
        </button>
      </div>
    </form>
  );
}

function CompleteForm({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const action = completeRepairRequestAction.bind(null, requestId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={(fd) => { formAction(fd); onDone(); }} className="flex flex-col gap-2.5 rounded-[11px] bg-field p-3.5">
      {state.error && <span className="text-xs text-critical-text">{state.error}</span>}
      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Completed on</span>
          <input name="completedOn" type="date" disabled={isPending} className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Cost (paise)</span>
          <input name="costPaise" type="number" min={0} disabled={isPending} placeholder="Optional" className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Repair action taken</span>
        <input name="repairAction" disabled={isPending} placeholder="e.g. Replaced the switchboard" className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
      </label>
      <TextAreaField label="Completion notes" name="completionNotes" disabled={isPending} rows={2} />
      <button type="submit" disabled={isPending} className="self-start rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
        {isPending ? "Saving…" : "Mark completed"}
      </button>
    </form>
  );
}

function CancelForm({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const action = cancelRepairRequestAction.bind(null, requestId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={(fd) => { formAction(fd); onDone(); }} className="flex flex-wrap items-end gap-2.5 rounded-[11px] bg-field p-3.5">
      {state.error && <span className="w-full text-xs text-critical-text">{state.error}</span>}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Reason (optional)</span>
        <input name="notes" disabled={isPending} className="w-72 rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
      </label>
      <button type="submit" disabled={isPending} className="rounded-[11px] bg-critical-bg px-3.5 py-2 text-sm font-bold text-critical-text disabled:opacity-60">
        {isPending ? "Cancelling…" : "Confirm cancel"}
      </button>
    </form>
  );
}
