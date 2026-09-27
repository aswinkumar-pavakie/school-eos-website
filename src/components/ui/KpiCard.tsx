// Component #2 — KPI card: eyebrow, value, one-line delta. Always used 4-in-a-2x2-grid.
export function KpiCard({
  eyebrow,
  value,
  delta,
  bar,
}: {
  eyebrow: string;
  value: string;
  delta?: string;
  /** Real 0-100 value driving a thin progress bar under the metric value --
   * same pattern as components/dashboard/KpiCard.tsx's own `bar` prop. Omit
   * for cards with no ratio to visualize. */
  bar?: number;
}) {
  return (
    <div className="card-hover rounded-[14px] border border-border bg-surface px-5 py-[18px]">
      <p className="text-[11px] font-bold tracking-[0.09em] text-text-muted uppercase">{eyebrow}</p>
      <p className="mt-2 font-mono text-2xl font-extrabold text-text">{value}</p>
      {bar !== undefined && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-[var(--radius-pill)] bg-border">
          <div
            className="h-full rounded-[var(--radius-pill)] bg-primary"
            style={{ width: `${Math.max(0, Math.min(100, bar))}%` }}
          />
        </div>
      )}
      {delta ? <p className="mt-1 text-sm text-text-muted">{delta}</p> : null}
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{children}</div>;
}
