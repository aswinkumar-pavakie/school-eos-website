"use client";

import { useTransition } from "react";
import { useFlash } from "@/components/sports-ui/FlashContext";
import { updateSessionStatusAction } from "./actions";

const NEXT: Record<string, string[]> = {
  SCHEDULED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function SessionStatusAction({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const { showFlash } = useFlash();
  const options = NEXT[status] ?? [];

  if (options.length === 0) return <span style={{ color: "var(--sport-tertiary-3)" }}>—</span>;

  return (
    <select
      disabled={pending}
      value=""
      onChange={(e) => {
        const next = e.target.value;
        if (!next) return;
        startTransition(async () => {
          try {
            await updateSessionStatusAction(id, next);
            showFlash(`Session marked ${next.toLowerCase()}.`);
          } catch (err) {
            showFlash(err instanceof Error ? err.message : "That didn't work. Please try again.");
          }
        });
      }}
      style={{ height: 30, fontSize: 12, border: "1px solid var(--sport-border)", borderRadius: 8, color: "var(--sport-body)" }}
    >
      <option value="">Mark as…</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o[0]}
          {o.slice(1).toLowerCase()}
        </option>
      ))}
    </select>
  );
}
