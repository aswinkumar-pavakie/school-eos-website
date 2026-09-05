// KPI card -- Design Architecture v0.1 component 02: eyebrow, value, one-line
// delta. Value uses the mono data font (--eos-kpi equivalent).

import Link from "next/link";

interface KpiCardProps {
  eyebrow: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  /** Optional -- when set, the whole card links to that page (e.g. Dashboard's
   * "Active students" -> /admin/students). Omit for cards with no single
   * obvious destination (most Finance/Inventory overview cards). */
  href?: string;
}

export function KpiCard({ eyebrow, value, detail, icon, href }: KpiCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        {/* --eos-eyebrow: 11/14 · 700 · .09em */}
        <p className="text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
          {eyebrow}
        </p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-primary/10 text-primary">
          {icon}
        </span>
      </div>
      {/* --eos-kpi: 24/28 · 800, tabular-nums mono */}
      <p className="mt-3 text-center font-mono text-[24px] font-extrabold leading-[28px] text-text">{value}</p>
      {/* --eos-body: 13/19 · 400 */}
      <p className="mt-2.5 text-center text-[13px] font-normal leading-[19px] text-text-muted">{detail}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-[16px] border border-border bg-surface p-[14px] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return <div className="rounded-[16px] border border-border bg-surface p-[14px]">{content}</div>;
}
