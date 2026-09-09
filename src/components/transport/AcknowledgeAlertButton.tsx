"use client";

import { useActionState } from "react";
import { acknowledgeAlertAction, type FormActionState } from "@/app/(dashboard)/transport-manager/actions";

const initialState: FormActionState = {};

export function AcknowledgeAlertButton({ alertId }: { alertId: string }) {
  const action = acknowledgeAlertAction.bind(null, alertId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <button
        type="submit"
        disabled={isPending}
        className="rounded-[11px] bg-primary px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Acknowledging…" : "Acknowledge"}
      </button>
      {state.error && <span className="text-xs text-critical-text">{state.error}</span>}
    </form>
  );
}
