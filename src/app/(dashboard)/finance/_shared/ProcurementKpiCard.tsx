// Richer KPI card for the POP/SOP Approval + Tracking dashboards — big number, a
// secondary stat line, a progress bar, and a caption. The shared KpiCard component
// (eyebrow+value+delta only) doesn't have room for the progress bar, so this is a
// deliberately separate variant rather than a change to that shared component's API.
export function ProcurementKpiCard({
  title,
  value,
  stat,
  progress,
  caption,
}: {
  title: string;
  value: string;
  /** e.g. "36 POP in view" — real count, never a fabricated figure. */
  stat?: string;
  /** 0-100 — omit to hide the progress bar entirely (never fake a proportion). */
  progress?: number;
  caption?: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <p className="text-[11px] font-bold tracking-[0.09em] text-text-muted uppercase">{title}</p>
      <p className="mt-2 font-mono text-2xl font-extrabold text-text">{value}</p>
      {stat && <p className="mt-1 text-sm font-bold text-primary">{stat}</p>}
      {progress !== undefined && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-field">
          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
      {caption && <p className="mt-1.5 text-xs text-text-muted">{caption}</p>}
    </div>
  );
}
