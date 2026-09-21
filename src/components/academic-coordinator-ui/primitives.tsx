import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import Link from "next/link";

// Direct port of the design's own repeated KPI-card markup (used identically
// on Dashboard/Reports/Students/Teachers/Planning/Syllabus/Analytics/
// Timetable) -- 14px radius, hover-lift via .acc-card-hover, 6px progress
// bar, "hi" = the highlighted blue figure inline with "sub".
export function KpiCard({
  label,
  value,
  hi,
  sub,
  barPct,
  foot,
  href,
}: {
  label: string;
  value: ReactNode;
  hi?: string;
  sub?: string;
  barPct?: number;
  foot?: string;
  href?: string;
}) {
  const body = (
    <div className="acc-card-hover" style={{ background: "var(--acc-surface)", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "19px 20px", cursor: href ? "pointer" : undefined, height: "100%", minWidth: 0, overflow: "hidden" }}>
      <div style={{ fontSize: 14, color: "#475569", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em", margin: "9px 0 6px", overflowWrap: "anywhere" }}>{value}</div>
      {(hi || sub) && (
        <div style={{ fontSize: 13, color: "var(--acc-body-muted)" }}>
          {hi && <span style={{ color: "var(--acc-accent)", fontWeight: 700 }}>{hi}</span>} {sub}
        </div>
      )}
      {barPct !== undefined && (
        <div style={{ height: 6, background: "#eef2f8", borderRadius: 99, marginTop: 13, overflow: "hidden" }}>
          <div style={{ height: 6, background: "var(--acc-accent)", borderRadius: 99, width: `${Math.max(0, Math.min(100, barPct))}%` }} />
        </div>
      )}
      {foot && <div style={{ fontSize: 12, color: "var(--acc-tertiary)", marginTop: 11 }}>{foot}</div>}
    </div>
  );
  if (!href) return body;
  return (
    <Link href={href} style={{ display: "block", height: "100%" }}>
      {body}
    </Link>
  );
}

export function Card({ children, style, hover = true }: { children: ReactNode; style?: CSSProperties; hover?: boolean }) {
  return (
    <div className={hover ? "acc-card-hover" : undefined} style={{ background: "var(--acc-surface)", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "20px 22px", ...style }}>
      {children}
    </div>
  );
}

// Every list-row inside a Card in the design shares this shape: hover-ring,
// bottom divider, flexible content. Callers supply the row's own inner
// layout as children.
export function Row({ children, onClick, style }: { children: ReactNode; onClick?: () => void; style?: CSSProperties }) {
  return (
    <div
      className="acc-row-hover"
      onClick={onClick}
      style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 10px", borderBottom: "1px solid var(--acc-divider-soft)", cursor: onClick ? "pointer" : undefined, ...style }}
    >
      {children}
    </div>
  );
}

export type PillTone = "blue" | "green" | "red" | "amber" | "gray";
const TONE_STYLES: Record<PillTone, { bg: string; fg: string }> = {
  blue: { bg: "var(--acc-accent-tint)", fg: "var(--acc-accent)" },
  green: { bg: "var(--acc-green-bg)", fg: "var(--acc-green)" },
  red: { bg: "var(--acc-red-bg)", fg: "var(--acc-red)" },
  amber: { bg: "var(--acc-amber-bg)", fg: "var(--acc-amber)" },
  gray: { bg: "#eef2f8", fg: "#475569" },
};
export function StatusPill({ label, tone }: { label: string; tone: PillTone }) {
  const t = TONE_STYLES[tone];
  return (
    <span style={{ display: "inline-block", background: t.bg, color: t.fg, borderRadius: 7, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>{label}</span>
  );
}

// Design's own filter-chip pattern (border+bg+fg driven by active state) --
// used for standard/class/status filters throughout.
export function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: "unset",
        cursor: "pointer",
        border: `1px solid ${active ? "var(--acc-accent)" : "var(--acc-btn-border)"}`,
        background: active ? "var(--acc-accent)" : "#fff",
        color: active ? "#fff" : "#334155",
        borderRadius: 9,
        padding: "9px 16px",
        fontSize: 13.5,
        fontWeight: 700,
      }}
    >
      {label}
    </button>
  );
}

const btnBase: CSSProperties = {
  border: 0,
  borderRadius: 10,
  padding: "11px 17px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

export function PrimaryButton({ children, style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} style={{ ...btnBase, background: "var(--acc-accent)", color: "#fff", ...style }}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} style={{ ...btnBase, background: "#fff", color: "var(--acc-navy)", border: "1px solid var(--acc-btn-border)", ...style }}>
      {children}
    </button>
  );
}

export function TableShell({ children, minWidth }: { children: ReactNode; minWidth?: number }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth }}>{children}</div>
    </div>
  );
}

export function EmptyPanel({ label = "Nothing to show yet." }: { label?: string }) {
  return <div style={{ padding: "44px 20px", textAlign: "center", fontSize: 14.5, color: "var(--acc-body-muted)" }}>{label}</div>;
}
