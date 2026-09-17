"use client";

import { useTransition } from "react";
import { useFlash } from "@/components/hostel-warden-ui/FlashContext";
import { HOSTEL_COMPLAINT_ALLOWED_TRANSITIONS, type HostelComplaintState } from "@/lib/hostel-warden-constants";
import { updateComplaintStatusAction } from "./actions";

export function StatusTransition({ id, state }: { id: string; state: HostelComplaintState }) {
  const [pending, startTransition] = useTransition();
  const { showFlash } = useFlash();
  const options = HOSTEL_COMPLAINT_ALLOWED_TRANSITIONS[state];

  if (options.length === 0) return <span style={{ color: "var(--hw-text-faint)" }}>—</span>;

  return (
    <select
      className="input"
      disabled={pending}
      value=""
      onChange={(e) => {
        const next = e.target.value as HostelComplaintState;
        if (!next) return;
        startTransition(async () => {
          try {
            await updateComplaintStatusAction(id, next);
            showFlash(`Issue moved to ${next.replace("_", " ").toLowerCase()}.`);
          } catch (err) {
            showFlash(err instanceof Error ? err.message : "That didn't work. Please try again.");
          }
        });
      }}
      style={{ height: 30, fontSize: 12 }}
    >
      <option value="">Move to…</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}
