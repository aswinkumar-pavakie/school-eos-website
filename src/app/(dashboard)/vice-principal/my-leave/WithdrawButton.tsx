"use client";

import { useState, useTransition } from "react";
import { withdrawMyLeaveAction } from "./actions";

export function WithdrawButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs font-bold text-critical-text disabled:opacity-60"
      >
        Withdraw
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <p className="text-xs font-medium text-critical-text">{error}</p>}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirming(false)}
          className="text-xs font-semibold text-text-muted disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await withdrawMyLeaveAction(id);
              if (result.error) setError(result.error);
              else setConfirming(false);
            })
          }
          className="rounded-[var(--radius-input)] bg-critical-text px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
        >
          {isPending ? "Withdrawing…" : "Confirm withdraw"}
        </button>
      </div>
    </div>
  );
}
