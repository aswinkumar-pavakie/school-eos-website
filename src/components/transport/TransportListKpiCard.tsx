// The 5-KPI row shown above every list screen (Fleet/Routes/Drivers &
// crew/Maintenance/Compliance) per the mockup's own logic: `showKpis: !sel &&
// tab !== 'dashboard'` -- true on every tab except the Dashboard itself,
// which has its own separate, differently-shaped stat cards (see
// TransportKpiCard, used only there). This card has no icon at all (the
// mockup's own `kpis` markup carries none), an optional top-right badge
// pill, and two distinct sub-lines (subA/subB) rather than one footer --
// structurally different from TransportKpiCard, not a variant of it. Numeric
// values use the app's mono font (JetBrains Mono) per explicit instruction
// -- its defining trait is a dotted zero. `href` (when given) navigates to
// the real page this KPI is about, matching the mockup's own KPI_NAV
// routing table (Buses->fleet, Routes/Students ferried/Avg occupancy->
// routes, Docs to renew->docs), translated to this app's real routes.

import Link from "next/link";

export interface TransportListKpiCardProps {
  label: string;
  value: string;
  unit?: string;
  badge?: string;
  bar?: number;
  subA?: string;
  subB?: string;
  href?: string;
}

export function TransportListKpiCard({ label, value, unit, badge, bar, subA, subB, href }: TransportListKpiCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2.5">
        <p className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-text-muted">{label}</p>
        {badge && (
          <span className="rounded-[999px] px-[9px] py-[3px] text-[11.5px] font-bold" style={{ background: "#EFF4FF", color: "#1E3A8A" }}>
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-[34px] font-extrabold leading-none tracking-[-0.03em] text-text">{value}</span>
        {unit && <span className="text-[13.5px] font-semibold text-text-muted">{unit}</span>}
      </div>
      {bar !== undefined && (
        <div className="mt-3.5 h-1.5 overflow-hidden rounded-full" style={{ background: "#EEF2F7" }}>
          <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, bar))}%`, background: "var(--color-primary)" }} />
        </div>
      )}
      {subA && <p className="mt-3.5 text-[13.5px]" style={{ color: "#334155" }}>{subA}</p>}
      {subB && <p className="mt-1 text-[12.5px]" style={{ color: "#94A3B8" }}>{subB}</p>}
    </>
  );

  const className =
    "block rounded-[14px] border border-border bg-surface p-[18px_20px] transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-1 hover:border-primary hover:shadow-[0_12px_26px_rgba(29,78,216,0.14)]";

  if (href) {
    return (
      <Link href={href} className={className} style={{ padding: "18px 20px" }}>
        {content}
      </Link>
    );
  }
  return (
    <div className={className} style={{ padding: "18px 20px" }}>
      {content}
    </div>
  );
}
