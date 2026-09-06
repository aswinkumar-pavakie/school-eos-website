"use client";

import { useActionState, useState } from "react";
import { refreshFineStatusAction, sendFineToFinanceAction, waiveFineAction, type FormActionState } from "./actions";
import type { LibraryFine } from "@/lib/library-api";

const initialState: FormActionState = {};

export function FineRowActions({ fine }: { fine: LibraryFine }) {
  const [waiveOpen, setWaiveOpen] = useState(false);
  const [sendPending, setSendPending] = useState(false);
  const [refreshPending, setRefreshPending] = useState(false);
  const waiveAction = waiveFineAction.bind(null, fine.id);
  const [state, formAction, isPending] = useActionState(waiveAction, initialState);

  if (fine.status === "PAID" || fine.status === "WAIVED" || fine.status === "CANCELLED") {
    return <span className="text-xs text-text-muted">—</span>;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {fine.status === "PENDING" && (
          <button
            type="button"
            disabled={sendPending}
            onClick={() => {
              setSendPending(true);
              sendFineToFinanceAction(fine.id).finally(() => setSendPending(false));
            }}
            className="rounded-[9px] bg-primary px-2.5 py-1 text-xs font-bold text-white disabled:opacity-60"
          >
            {sendPending ? "Sending…" : "Send to Finance"}
          </button>
        )}
        {fine.status === "SENT_TO_FINANCE" && (
          <button
            type="button"
            disabled={refreshPending}
            onClick={() => {
              setRefreshPending(true);
              refreshFineStatusAction(fine.id).finally(() => setRefreshPending(false));
            }}
            className="rounded-[9px] border border-border px-2.5 py-1 text-xs font-semibold text-text hover:bg-field disabled:opacity-60"
          >
            {refreshPending ? "Checking…" : "Refresh status"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setWaiveOpen((v) => !v)}
          className="rounded-[9px] border border-border px-2.5 py-1 text-xs font-semibold text-critical-text hover:bg-field"
        >
          Waive
        </button>
      </div>

      {waiveOpen && (
        <form
          action={(fd) => { formAction(fd); setWaiveOpen(false); }}
          className="flex w-full flex-wrap items-end justify-end gap-2.5 rounded-[11px] bg-field p-3.5"
        >
          {state.error && <span className="w-full text-right text-xs text-critical-text">{state.error}</span>}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Reason *</span>
            <input name="reason" required disabled={isPending} className="w-56 rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary" />
          </label>
          <button type="submit" disabled={isPending} className="rounded-[11px] bg-critical-bg px-3.5 py-2 text-sm font-bold text-critical-text disabled:opacity-60">
            {isPending ? "Saving…" : "Confirm waive"}
          </button>
        </form>
      )}
    </div>
  );
}
