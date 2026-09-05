// Status pill -- Design Architecture v0.1 component 09: one of three status
// colours, 7px radius, never on a pressable surface. One vocabulary reused
// everywhere a record has a state.

type Tone = "success" | "pending" | "critical";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success-bg text-success-text",
  pending: "bg-pending-bg text-pending-text",
  critical: "bg-critical-bg text-critical-text",
};

export function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-[7px] px-2 py-0.5 text-[11.5px] font-bold ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
