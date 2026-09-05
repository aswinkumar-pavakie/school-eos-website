"use client";

// Deactivating a parent locks them out of the portal (and, if the app enforces
// it, the mobile app) immediately -- deliberately harder to do by accident than
// a single click, hence the type-to-confirm step. Only lives in the profile
// view, never in the parents list, so it's never one misplaced click away
// during a routine scan of the table.

import { useState, useTransition } from "react";
import { activateParentAction, deactivateParentAction } from "@/app/(dashboard)/admin/parents/actions";

const CONFIRM_WORD = "DEACTIVATE";

export function ParentAccountStatusAction({ personId, status }: { personId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const isActive = status === "ACTIVE";

  if (!isActive) {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => activateParentAction(personId))}
        className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Activating…" : "Activate account"}
      </button>
    );
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-[11px] border border-critical-text px-4 py-2.5 text-sm font-bold text-critical-text hover:bg-critical-bg"
      >
        Deactivate account
      </button>
    );
  }

  return (
    <div className="rounded-[11px] border border-critical-text bg-critical-bg p-3.5">
      <p className="text-sm font-semibold text-critical-text">
        This locks the parent out of their login immediately. Type {CONFIRM_WORD} to confirm.
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={isPending}
          placeholder={CONFIRM_WORD}
          autoFocus
          className="rounded-[11px] border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={isPending || confirmText.trim().toUpperCase() !== CONFIRM_WORD}
          onClick={() =>
            startTransition(async () => {
              await deactivateParentAction(personId);
              setConfirming(false);
              setConfirmText("");
            })
          }
          className="rounded-[11px] bg-critical-text px-3.5 py-2 text-sm font-bold text-white disabled:opacity-40"
        >
          {isPending ? "Deactivating…" : "Confirm deactivate"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setConfirming(false);
            setConfirmText("");
          }}
          className="text-sm font-semibold text-text-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
