// Transport Manager's own KPI card -- pixel-matched to "Transport Module.dc.html"'s
// own stat-card markup (the isDash block's kpis/statCards), which genuinely has
// an icon badge and (for the Buses card) a real segmented/legend bar that the
// shared dashboard/KpiCard component doesn't support (that component is
// correctly icon-less -- Principal's own mockup has no icon on its stat
// cards). Built as its own component rather than bent to fit the shared one,
// per explicit instruction: don't force an older shared pattern where the
// real design genuinely differs.

import Link from "next/link";
import type { ReactNode } from "react";

export interface LegendItem {
  label: string;
  value: number;
  color: string;
}

export interface TransportKpiCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  value: string;
  unit?: string;
  /** A bold-colored-number + gray-label line right under the value (Occupancy's
   * "72 seats free across fleet", Renewals' "3 document renewals due") --
   * mutually exclusive with `legend` (Buses has a legend, not this). */
  highlight?: { value: string | number; label: string };
  /** Single-color bar (Occupancy/Renewals) as a 0-100 percent, OR a real
   * segmented bar (Buses) built from `legend` proportions -- never both. */
  bar?: number;
  legend?: LegendItem[];
  footer?: string;
  href?: string;
}

export function TransportKpiCard({ icon, title, subtitle, value, unit, highlight, bar, legend, footer, href }: TransportKpiCardProps) {
  const legendTotal = legend?.reduce((sum, l) => sum + l.value, 0) ?? 0;
  // The Buses card (fleetTotal, with a legend) is 48px per the mockup's own
  // markup; every other stat card (s.value, no legend) is 40px -- two
  // distinct sizes, not one shared value size. The mockup itself renders
  // these in its plain sans font, but per explicit instruction every numeric
  // value here uses the app's mono font (JetBrains Mono) instead -- its
  // defining trait is a dotted zero, which is the whole point of this
  // change.
  const isFleetCard = !!legend;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[14.5px] font-bold" style={{ color: "#334155" }}>{title}</p>
          {subtitle && (
            <p className="mt-1 text-[13.5px]" style={{ color: "#94A3B8" }}>
              {subtitle}
            </p>
          )}
        </div>
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] text-primary" style={{ background: "#EFF4FF" }}>
          {icon}
        </span>
      </div>

      <p className={`flex items-end gap-2 ${isFleetCard ? "mt-4" : "mt-3.5"}`}>
        <span
          className={`font-mono font-extrabold leading-none tracking-[-0.03em] text-text ${isFleetCard ? "text-[48px]" : "text-[40px]"}`}
        >
          {value}
        </span>
        {unit && <span className="pb-1.5 text-[15px] text-text-muted">{unit}</span>}
      </p>

      {highlight && (
        <p className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-[18px] font-extrabold text-primary">{highlight.value}</span>
          <span className="text-[16px]" style={{ color: "#475569" }}>
            {highlight.label}
          </span>
        </p>
      )}

      {legend && legend.length > 0 ? (
        <>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-[var(--radius-pill)]" style={{ background: "var(--color-field)" }}>
            {legend.map((l) => (
              <div key={l.label} style={{ width: legendTotal > 0 ? `${(l.value / legendTotal) * 100}%` : 0, background: l.color }} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {legend.map((l) => (
              <div key={l.label}>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-[3px]" style={{ background: l.color }} />
                  <span className="font-mono text-[22px] font-extrabold leading-none text-text">{l.value}</span>
                </div>
                <p className="mt-1 text-[14px] text-text-muted">{l.label}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        bar !== undefined && (
          <div className="mt-3 overflow-hidden rounded-[var(--radius-pill)]" style={{ background: "#EEF2F7", height: 6 }}>
            <div className="h-full rounded-[var(--radius-pill)]" style={{ width: `${Math.max(0, Math.min(100, bar))}%`, background: "var(--color-primary)" }} />
          </div>
        )
      )}

      {footer && (
        <p className={`text-[15px] text-text-muted ${legend ? "mt-4 border-t pt-3.5" : "mt-3"}`} style={legend ? { borderColor: "var(--color-border)" } : undefined}>
          {footer}
        </p>
      )}
    </>
  );

  const className =
    "block rounded-[16px] border border-border bg-surface p-[20px] transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-1 hover:border-primary hover:shadow-[0_12px_26px_rgba(29,78,216,0.14)]";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
