// KPI card -- pixel-matched to the approved SIS mockup's actual stat-card
// markup (Principal Console.dc.html, the "page.hasStats" block), checked
// against the literal source rather than inferred from style.specs' prose:
// the value has NO font-family override there (inherits the page's default
// Outfit sans, NOT the mono data font -- an earlier pass wrongly assumed
// "amounts" in style.specs' font rule covered these), weight 700 at 38px
// with -0.03em tracking, 14px card radius / 20px padding (the spec's "Stat
// card" geometry, distinct from the generic 16px/22px "Card"), and a two-tone
// detail: a 14px "sub" line then an optional 13px "note" line, each its own
// color. `icon` is kept as an accepted (but unused) prop so every existing
// Admin/Finance/Library/Principal/VP call site keeps compiling unchanged --
// this is a shared component, so the new look cascades to every role's
// dashboard for free once it's used there. The three added text tones
// (--color-text-label/-secondary/-tertiary) exist only inside the design-
// reframe theme scope (see ReframeTheme.tsx); outside it they fall back to
// the base app's existing --color-text-muted so Finance/Library's own
// un-reframed dashboards render exactly as before.

import Link from "next/link";

interface KpiCardProps {
  eyebrow: string;
  value: string;
  /** One line, or up to two real lines (e.g. a value's own breakdown) --
   * never pad a second line with anything that isn't real data. The first
   * line renders as the mockup's "sub" (14px, darker), the second as its
   * "note" (13px, lighter). */
  detail: string | string[];
  /** A small icon chip rendered top-right of the eyebrow (34px, rounded-9,
   * light-blue fill, primary-colored glyph) -- per explicit follow-up
   * instruction with its own reference design; every real call site already
   * passes a real, semantically-correct icon (StudentsIcon for "Active
   * students", HostelIcon for "Hostel occupancy", etc.), previously just
   * never rendered. Renders in the same slot `pctBadge` uses; a card that
   * genuinely has both stacks them (rare -- no current caller passes both). */
  icon?: React.ReactNode;
  /** Optional -- when set, the whole card links to that page (e.g. Dashboard's
   * "Active students" -> /admin/students). Omit for cards with no single
   * obvious destination (most Finance/Inventory overview cards). */
  href?: string;
  /** Real percent text shown as a small chip top-right of the eyebrow (e.g.
   * "18%") -- per the mockup's stat.pct. Omit entirely for cards with no
   * percent framing (most Dashboard KPIs). Never a fabricated/rounded-for-
   * looks number -- pass the same real percent used to compute `bar`. */
  pctBadge?: string;
  /** Real 0-100 value driving a thin progress bar under the metric value --
   * per the mockup's stat.bar. Omit for cards with no ratio to visualize. */
  bar?: number;
}

export function KpiCard({ eyebrow, value, detail, href, pctBadge, bar, icon }: KpiCardProps) {
  const [sub, note] = Array.isArray(detail) ? detail : [detail];
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p
          className="text-[11px] font-semibold uppercase leading-[14px] tracking-[0.11em]"
          style={{ color: "var(--color-text-label, var(--color-text-muted))" }}
        >
          {eyebrow}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {pctBadge && (
            <span
              className="rounded-[var(--radius-pill)] px-2.5 py-1 text-[12px] font-semibold"
              style={{
                color: "var(--color-primary-deep)",
                background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
              }}
            >
              {pctBadge}
            </span>
          )}
          {icon && (
            <span
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px]"
              style={{
                color: "var(--color-primary-deep)",
                background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
              }}
            >
              {icon}
            </span>
          )}
        </div>
      </div>
      <p className="mt-4 text-[36px] font-extrabold leading-none tracking-[-0.03em] text-text">{value}</p>
      {bar !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-[var(--radius-pill)]" style={{ background: "var(--color-border)" }}>
          <div
            className="h-full rounded-[var(--radius-pill)]"
            style={{ width: `${Math.max(0, Math.min(100, bar))}%`, background: "var(--color-primary)" }}
          />
        </div>
      )}
      <div className="mt-3 flex flex-col gap-1">
        {sub && (
          <p
            className="text-[14px] leading-[18px]"
            style={{ color: "var(--color-text-secondary, var(--color-text-muted))" }}
          >
            {sub}
          </p>
        )}
        {note && (
          <p
            className="text-[13px] leading-[17px]"
            style={{ color: "var(--color-text-tertiary, var(--color-text-muted))" }}
          >
            {note}
          </p>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        // Hover per the mockup's own inline style-hover on this exact block:
        // translateY(-4px), full-opacity primary border, and this specific
        // shadow -- distinct from the generic "Card hover" values elsewhere.
        className="block rounded-[14px] border border-border bg-surface p-[20px] transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-1 hover:border-primary hover:shadow-[0_10px_22px_rgba(29,78,216,0.14)]"
      >
        {content}
      </Link>
    );
  }

  return <div className="card-hover rounded-[14px] border border-border bg-surface p-[20px]">{content}</div>;
}
