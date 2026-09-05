import { statusLabel, statusTone } from "@/lib/format";

const TONE_CLASSES = {
  success: "bg-success-bg text-success-text",
  pending: "bg-pending-bg text-pending-text",
  critical: "bg-critical-bg text-critical-text",
} as const;

// Component #9 — status pill/badge: one of exactly 3 status colors, 7px radius, never
// on a pressable surface, always carries a word (never color alone).
export function StatusPill({ state }: { state: string }) {
  const tone = statusTone(state);
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-bold tracking-wide uppercase ${TONE_CLASSES[tone]}`}
    >
      {statusLabel(state)}
    </span>
  );
}
