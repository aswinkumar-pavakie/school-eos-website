import Link from "next/link";

// Verbatim port of the design's own dashStats card markup (see Warden
// Console.dc.html's `isDashboard` block) -- icon path data (`d`) is passed in
// per caller from the same icon set as the sidebar nav.
export function DashboardStat({
  label,
  value,
  deltaStrong,
  deltaText,
  note,
  percent,
  d,
  href,
}: {
  label: string;
  value: string;
  deltaStrong: string;
  deltaText: string;
  note: string;
  percent: number;
  d: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="hw-lift"
      style={{
        border: "1px solid var(--hw-divider)",
        borderRadius: "var(--hw-radius-md)",
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        background: "var(--hw-surface)",
        color: "inherit",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "var(--hw-text)" }}>{label}</span>
        <span style={{ width: 34, height: 34, flex: "0 0 34px", borderRadius: 9, background: "var(--hw-accent-100)", display: "grid", placeItems: "center" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--hw-accent)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d={d} />
          </svg>
        </span>
      </div>
      <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere" }}>{value}</div>
      <div style={{ fontSize: 13.5, color: "var(--hw-text-muted)" }}>
        <b style={{ color: "var(--hw-accent)" }}>{deltaStrong}</b> {deltaText}
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "#edf0f4", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 99, background: "var(--hw-accent)", width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
      <div style={{ fontSize: 12.5, color: "var(--hw-text-faint)" }}>{note}</div>
    </Link>
  );
}
