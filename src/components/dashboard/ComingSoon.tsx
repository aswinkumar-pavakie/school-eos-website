// Shared placeholder for modules not yet built on the frontend. Matches Design
// Architecture v0.1's empty-state rule (section 05, #25): state the fact, no
// exclamation marks, no fake data standing in for a real screen.

interface ComingSoonProps {
  title: string;
  note?: string;
}

export function ComingSoon({ title, note }: ComingSoonProps) {
  return (
    <div>
      {/* --eos-h1: 28/34 · 700 */}
      <h1 className="text-[28px] font-bold leading-[34px] text-text">{title}</h1>
      <div className="mt-6 flex min-h-[280px] flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-surface px-6 py-16 text-center">
        {/* --eos-card: 15/20 · 800 */}
        <p className="text-[15px] font-extrabold leading-[20px] text-text">
          This module isn&apos;t built yet
        </p>
        <p className="mt-1.5 max-w-sm text-sm leading-[19px] text-text-muted">
          {note ?? "This screen is coming in a later phase."}
        </p>
      </div>
    </div>
  );
}
