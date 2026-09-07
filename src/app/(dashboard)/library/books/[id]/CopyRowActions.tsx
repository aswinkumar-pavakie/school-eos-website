"use client";

// Every per-copy status action -- toggled inline forms, same rhythm as Inventory's
// InventoryItemActions. Only the actions valid for the copy's current status are
// ever offered, so there's no dead button that would just 409 on submit.

import { useActionState, useEffect, useRef, useState } from "react";
import {
  markCopyDamagedAction,
  markCopyLostAction,
  markCopyUnderRepairAction,
  restoreCopyAction,
  updateCopyAction,
  withdrawCopyAction,
  type FormActionState,
} from "../actions";
import { issueCopyAction } from "../../circulation/actions";
import { MemberPicker } from "@/components/library/MemberPicker";
import type { MemberHit } from "../../search-actions";
import type { BookCopy } from "@/lib/library-api";

const initialState: FormActionState = {};

type ActionKey = "edit" | "issue" | "lost" | "damaged" | null;

export function CopyRowActions({ bookId, copy }: { bookId: string; copy: BookCopy }) {
  const [open, setOpen] = useState<ActionKey>(null);
  const toggle = (key: ActionKey) => setOpen((v) => (v === key ? null : key));

  if (copy.status === "RETIRED") {
    return <span className="text-xs text-text-muted">No further actions.</span>;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex shrink-0 items-center justify-end gap-1.5 whitespace-nowrap">
        <button
          type="button"
          onClick={() => toggle("edit")}
          className={`rounded-[9px] border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            open === "edit" ? "border-primary bg-primary/10 text-primary" : "border-border text-text hover:bg-field"
          }`}
        >
          Edit
        </button>
        {(copy.status === "AVAILABLE" || copy.status === "RESERVED") && (
          <button
            type="button"
            onClick={() => toggle("issue")}
            className={`rounded-[9px] px-2.5 py-1.5 text-xs font-bold transition-colors ${
              open === "issue" ? "bg-primary/80 text-white" : "bg-primary text-white hover:opacity-90"
            }`}
          >
            Issue
          </button>
        )}
        <MoreActionsMenu
          bookId={bookId}
          copy={copy}
          onOpenLost={() => toggle("lost")}
          onOpenDamaged={() => toggle("damaged")}
        />
      </div>

      {copy.status === "RESERVED" && open !== "issue" && (
        <p className="text-xs text-text-muted">Held for a reservation -- issuing only succeeds for that member.</p>
      )}

      {open === "edit" && <EditCopyForm bookId={bookId} copy={copy} onDone={() => setOpen(null)} />}
      {open === "issue" && <IssueCopyForm bookId={bookId} copyId={copy.id} onDone={() => setOpen(null)} />}
      {open === "lost" && <ReportLostOrDamagedForm bookId={bookId} copyId={copy.id} type="lost" onDone={() => setOpen(null)} />}
      {open === "damaged" && <ReportLostOrDamagedForm bookId={bookId} copyId={copy.id} type="damaged" onDone={() => setOpen(null)} />}
    </div>
  );
}

/** Mark lost / Mark damaged (opens a small reason/notes form below the row,
 * via the two onOpen callbacks) / Under repair / Restore / Withdraw -- tucked
 * behind one trigger so a copy row never grows past three visible controls. */
type MoreActionKey = "underRepair" | "restore" | "withdraw";

function MoreActionsMenu({
  bookId,
  copy,
  onOpenLost,
  onOpenDamaged,
}: {
  bookId: string;
  copy: BookCopy;
  onOpenLost: () => void;
  onOpenDamaged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<MoreActionKey | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Only ever offer an action the copy's current status can actually take --
  // matches each endpoint's own source-state validation, so nothing here is a
  // dead button that would just 409 on submit.
  // "Mark lost"/"Mark damaged" open a small reason/notes form below the row
  // (via onOpenLost/onOpenDamaged) instead of firing instantly -- everything
  // else here still fires immediately since it has nothing to capture.
  type Item = { key: string; label: string; openForm?: () => void; run?: () => Promise<void> };
  const items: Item[] = [
    ...(copy.status !== "LOST" ? [{ key: "lost", label: "Mark lost", openForm: onOpenLost }] : []),
    ...(copy.status !== "DAMAGED" ? [{ key: "damaged", label: "Mark damaged", openForm: onOpenDamaged }] : []),
    ...(copy.status === "AVAILABLE"
      ? [{ key: "underRepair" as const, label: "Mark under repair", run: () => markCopyUnderRepairAction(bookId, copy.id) }]
      : []),
    ...(copy.status === "UNDER_REPAIR"
      ? [{ key: "restore" as const, label: "Restore to available", run: () => restoreCopyAction(bookId, copy.id) }]
      : []),
    ...(copy.status === "AVAILABLE"
      ? [{ key: "withdraw" as const, label: "Withdraw", run: () => withdrawCopyAction(bookId, copy.id) }]
      : []),
  ];

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        className="flex h-7 w-7 items-center justify-center rounded-[9px] border border-border text-text-muted transition-colors hover:bg-field"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <circle cx="5" cy="12" r="1.6" fill="currentColor" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
          <circle cx="19" cy="12" r="1.6" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-10 w-40 rounded-[11px] border border-border bg-surface p-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              disabled={pendingAction !== null}
              onClick={() => {
                if (item.openForm) {
                  item.openForm();
                  setOpen(false);
                  return;
                }
                setPendingAction(item.key as MoreActionKey);
                item.run!().finally(() => {
                  setPendingAction(null);
                  setOpen(false);
                });
              }}
              className={`block w-full rounded-[8px] px-2.5 py-2 text-left text-[13px] font-semibold transition-colors disabled:opacity-60 ${
                item.key === "restore" ? "text-primary hover:bg-primary/10" : "text-critical-text hover:bg-critical-bg"
              }`}
            >
              {pendingAction === item.key ? "Saving…" : item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditCopyForm({ bookId, copy, onDone }: { bookId: string; copy: BookCopy; onDone: () => void }) {
  const action = updateCopyAction.bind(null, bookId, copy.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form
      action={(fd) => { formAction(fd); onDone(); }}
      className="flex w-full flex-wrap items-end justify-end gap-2.5 rounded-[11px] bg-field p-3.5"
    >
      {state.error && <span className="w-full text-xs text-critical-text">{state.error}</span>}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Copy code</span>
        <input name="copyCode" defaultValue={copy.copyCode} disabled={isPending} className="w-40 rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Shelf location</span>
        <input name="shelfLocation" defaultValue={copy.shelfLocation ?? ""} disabled={isPending} className="w-40 rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
      </label>
      <button type="submit" disabled={isPending} className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function IssueCopyForm({ bookId, copyId, onDone }: { bookId: string; copyId: string; onDone: () => void }) {
  const [member, setMember] = useState<MemberHit | null>(null);
  const action = issueCopyAction.bind(null, bookId, copyId, member?.id ?? "");
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={(fd) => { formAction(fd); onDone(); }} className="flex w-full flex-wrap items-end justify-end gap-2.5 rounded-[11px] bg-field p-3.5">
      {state.error && <span className="w-full text-right text-xs text-critical-text">{state.error}</span>}
      <div className="w-56">
        <MemberPicker label="Issue to" disabled={isPending} onSelect={setMember} />
      </div>
      <button type="submit" disabled={isPending || !member} className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
        {isPending ? "Issuing…" : "Issue"}
      </button>
    </form>
  );
}

/** Mark lost/damaged -- captures an optional reason + notes so the Lost &
 * Damaged module has something real to show beyond "someone flipped a status".
 * Both fields are optional: reporting can't be blocked just because a
 * librarian doesn't have detail to hand right now. */
function ReportLostOrDamagedForm({
  bookId,
  copyId,
  type,
  onDone,
}: {
  bookId: string;
  copyId: string;
  type: "lost" | "damaged";
  onDone: () => void;
}) {
  const action = (type === "lost" ? markCopyLostAction : markCopyDamagedAction).bind(null, bookId, copyId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form
      action={(fd) => { formAction(fd); onDone(); }}
      className="flex w-full flex-wrap items-end justify-end gap-2.5 rounded-[11px] bg-field p-3.5"
    >
      {state.error && <span className="w-full text-xs text-critical-text">{state.error}</span>}
      <label className="flex flex-1 flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Reason (optional)</span>
        <input
          name="reason"
          disabled={isPending}
          placeholder={type === "lost" ? "e.g. Not returned, unaccounted for" : "e.g. Water damage, torn pages"}
          className="w-full rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
        />
      </label>
      <label className="flex flex-1 flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Notes (optional)</span>
        <input name="notes" disabled={isPending} className="w-full rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
      </label>
      <button type="submit" disabled={isPending} className="rounded-[11px] bg-critical-text px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
        {isPending ? "Saving…" : type === "lost" ? "Mark lost" : "Mark damaged"}
      </button>
    </form>
  );
}
