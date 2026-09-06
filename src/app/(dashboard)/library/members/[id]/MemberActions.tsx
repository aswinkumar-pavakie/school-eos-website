"use client";

import { useActionState, useState } from "react";
import { reactivateMemberAction, suspendMemberAction, updateMemberAction, type FormActionState } from "../actions";
import type { LibraryMemberDetail } from "@/lib/library-api";

const initialState: FormActionState = {};

type ActionKey = "suspend" | "edit" | null;

export function MemberActions({ member }: { member: LibraryMemberDetail }) {
  const [open, setOpen] = useState<ActionKey>(null);
  const toggle = (key: ActionKey) => setOpen((v) => (v === key ? null : key));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => toggle("edit")} className="rounded-[11px] border border-border px-3.5 py-2 text-[13px] font-semibold text-text hover:bg-field">
          Edit max books
        </button>
        {member.status === "ACTIVE" && (
          <button type="button" onClick={() => toggle("suspend")} className="rounded-[11px] border border-border px-3.5 py-2 text-[13px] font-semibold text-critical-text hover:bg-field">
            Suspend
          </button>
        )}
        {member.status === "SUSPENDED" && <ReactivateButton memberId={member.id} />}
      </div>

      {open === "edit" && <EditMaxBooksForm member={member} onDone={() => setOpen(null)} />}
      {open === "suspend" && <SuspendForm memberId={member.id} onDone={() => setOpen(null)} />}
    </div>
  );
}

function ReactivateButton({ memberId }: { memberId: string }) {
  const [isPending, setIsPending] = useState(false);
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        setIsPending(true);
        reactivateMemberAction(memberId).finally(() => setIsPending(false));
      }}
      className="rounded-[11px] bg-primary px-3.5 py-2 text-[13px] font-bold text-white disabled:opacity-60"
    >
      {isPending ? "Reactivating…" : "Reactivate"}
    </button>
  );
}

function EditMaxBooksForm({ member, onDone }: { member: LibraryMemberDetail; onDone: () => void }) {
  const action = updateMemberAction.bind(null, member.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={(fd) => { formAction(fd); onDone(); }} className="flex flex-wrap items-end gap-2.5 rounded-[11px] bg-field p-3.5">
      {state.error && <span className="w-full text-xs text-critical-text">{state.error}</span>}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Max books allowed</span>
        <input name="maxBooksAllowed" type="number" min={1} defaultValue={member.maxBooksAllowed} disabled={isPending} className="w-32 rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
      </label>
      <button type="submit" disabled={isPending} className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function SuspendForm({ memberId, onDone }: { memberId: string; onDone: () => void }) {
  const action = suspendMemberAction.bind(null, memberId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={(fd) => { formAction(fd); onDone(); }} className="flex flex-wrap items-end gap-2.5 rounded-[11px] bg-field p-3.5">
      {state.error && <span className="w-full text-xs text-critical-text">{state.error}</span>}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Reason *</span>
        <input name="reason" required disabled={isPending} placeholder="e.g. lost book, unpaid fine" className="w-72 rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
      </label>
      <button type="submit" disabled={isPending} className="rounded-[11px] bg-critical-bg px-3.5 py-2 text-sm font-bold text-critical-text disabled:opacity-60">
        {isPending ? "Saving…" : "Suspend"}
      </button>
    </form>
  );
}
