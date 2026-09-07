// Component #2 — KPI card: eyebrow, value, one-line delta. Always used 4-in-a-2x2-grid.
export function KpiCard({
  eyebrow,
  value,
  delta,
}: {
  eyebrow: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <p className="text-[11px] font-bold tracking-[0.09em] text-text-muted uppercase">{eyebrow}</p>
      <p className="mt-2 font-mono text-2xl font-extrabold text-text">{value}</p>
      {delta ? <p className="mt-1 text-sm text-text-muted">{delta}</p> : null}
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{children}</div>;
}
