"use client";

import { useState, useTransition } from "react";
import { startInitiativeAction } from "@/app/(dashboard)/community/activities/actions";

// "Start" only -- "Complete" needs real form input since Phase 7 (an optional
// outcome), so that's CompleteInitiativeForm, a proper form, not a bare button.
export function InitiativeLifecycleButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await startInitiativeAction(id);
            if (result?.error) setError(result.error);
          })
        }
        className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "…" : "Start"}
      </button>
      {error && <p className="max-w-[220px] text-right text-xs text-critical-text">{error}</p>}
    </div>
  );
}
