"use client";

// The real canteen/ID-card wallet -- freezing it stops spending (a lost ID card
// with balance left on it is the main misuse case) without touching the
// student's enrolment or the parent's own login. Enforcing the freeze at the
// actual point of sale (mobile app / card reader) is a separate, later piece of
// work -- this is just the admin-side control and the real flag it sets.

import { useActionState, useState, useTransition } from "react";
import {
  freezeWalletAction,
  unfreezeWalletAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/students/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate, formatMoneySummary } from "@/lib/format";

export interface StudentWallet {
  id: string;
  balancePaise: string;
  status: "ACTIVE" | "FROZEN" | "CLOSED";
  frozenReason: string | null;
  frozenAt: string | null;
}

const initialState: FormActionState = {};

export function StudentWalletSection({
  studentId,
  wallet,
}: {
  studentId: string;
  wallet: StudentWallet | null;
}) {
  const [unfreezing, startUnfreeze] = useTransition();
  const [freezing, setFreezing] = useState(false);
  const freezeAction = freezeWalletAction.bind(null, studentId);
  const [state, formAction, isPending] = useActionState(freezeAction, initialState);

  if (!wallet) {
    return <p className="text-sm text-text-muted">No wallet on file for this student.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        <StatusPill
          tone={wallet.status === "ACTIVE" ? "success" : wallet.status === "FROZEN" ? "critical" : "pending"}
          label={wallet.status.charAt(0) + wallet.status.slice(1).toLowerCase()}
        />
        <span className="font-mono text-[15px] font-bold text-text">{formatMoneySummary(wallet.balancePaise)}</span>
      </div>

      {wallet.status === "FROZEN" && (
        <div className="mt-2.5 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm text-critical-text">
          <p className="font-semibold">Frozen{wallet.frozenAt ? ` on ${formatDate(wallet.frozenAt)}` : ""}</p>
          {wallet.frozenReason && <p className="mt-0.5">{wallet.frozenReason}</p>}
        </div>
      )}

      <div className="mt-3">
        {wallet.status === "ACTIVE" && !freezing && (
          <button
            type="button"
            onClick={() => setFreezing(true)}
            className="rounded-[11px] border border-critical-text px-3.5 py-2 text-sm font-bold text-critical-text hover:bg-critical-bg"
          >
            Freeze wallet
          </button>
        )}

        {wallet.status === "ACTIVE" && freezing && (
          <form
            action={(formData) => {
              formAction(formData);
              setFreezing(false);
            }}
            className="flex flex-col gap-2.5 rounded-[11px] bg-field p-3.5"
          >
            {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Reason *</span>
              <input
                name="reason"
                required
                minLength={3}
                disabled={isPending}
                placeholder="e.g. Lost ID card"
                autoFocus
                className="rounded-[11px] border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
              />
            </label>
            <div className="flex items-center gap-2.5">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-[11px] bg-critical-text px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {isPending ? "Freezing…" : "Confirm freeze"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setFreezing(false)}
                className="text-sm font-semibold text-text-muted"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {wallet.status === "FROZEN" && (
          <button
            type="button"
            disabled={unfreezing}
            onClick={() => startUnfreeze(() => unfreezeWalletAction(studentId))}
            className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {unfreezing ? "Unfreezing…" : "Unfreeze wallet"}
          </button>
        )}
      </div>
    </div>
  );
}
