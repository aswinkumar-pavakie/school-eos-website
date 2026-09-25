import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

export function Card({ children, style, hover = true, onClick }: { children: ReactNode; style?: CSSProperties; hover?: boolean; onClick?: () => void }) {
  return (
    <div
      className={hover ? "parent-card-hover" : undefined}
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid var(--par-border)",
        borderRadius: "var(--par-radius-card)",
        padding: "18px 20px",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export type PillTone = "blue" | "red" | "amber" | "gray";
const TONE: Record<PillTone, { bg: string; fg: string }> = {
  blue: { bg: "var(--par-tint)", fg: "var(--par-primary)" },
  red: { bg: "var(--par-red-bg)", fg: "var(--par-red)" },
  amber: { bg: "var(--par-amber-bg)", fg: "var(--par-amber)" },
  gray: { bg: "var(--par-panel)", fg: "var(--par-body)" },
};
export function StatusPill({ label, tone }: { label: string; tone: PillTone }) {
  const t = TONE[tone];
  return (
    <span style={{ display: "inline-block", background: t.bg, color: t.fg, borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 600 }}>
      {label}
    </span>
  );
}

const btnBase: CSSProperties = { border: 0, borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 600, lineHeight: 1.2, cursor: "pointer", fontFamily: "inherit" };
export function PrimaryButton({ children, style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className="ui-btn" style={{ ...btnBase, background: "var(--par-primary)", color: "#fff", ...style }}>
      {children}
    </button>
  );
}
export function SecondaryButton({ children, style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className="ui-btn" style={{ ...btnBase, background: "#fff", color: "var(--par-navy)", border: "1px solid var(--par-border)", ...style }}>
      {children}
    </button>
  );
}

export function EmptyPanel({ label = "Nothing to show yet." }: { label?: string }) {
  return <div style={{ padding: "44px 20px", textAlign: "center", fontSize: 14, color: "var(--par-tertiary)", background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card)" }}>{label}</div>;
}
