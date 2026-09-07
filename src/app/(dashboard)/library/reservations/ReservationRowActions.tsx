"use client";

import { useState } from "react";
import { cancelReservationAction } from "./actions";

export function ReservationRowActions({ reservationId, status }: { reservationId: string; status: string }) {
  const [isPending, setIsPending] = useState(false);
  if (status !== "PENDING" && status !== "READY") return <span className="text-xs text-text-muted">—</span>;
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        setIsPending(true);
        cancelReservationAction(reservationId).finally(() => setIsPending(false));
      }}
      className="rounded-[9px] border border-border px-2.5 py-1 text-xs font-semibold text-critical-text hover:bg-field disabled:opacity-60"
    >
      {isPending ? "Cancelling…" : "Cancel"}
    </button>
  );
}
