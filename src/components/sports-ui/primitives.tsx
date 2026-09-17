import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

export function Card({ children, style, hover = false, onClick }: { children: ReactNode; style?: CSSProperties; hover?: boolean; onClick?: () => void }) {
  return (
    <div
      className={hover ? "sport-card-hover" : undefined}
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid var(--sport-border)",
        borderRadius: "var(--sport-radius-card)",
        padding: "20px 24px",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Matches the design's own TONE object + toneOf() regex matcher exactly:
// good/warn/bad/info/mute/dark.
export type PillTone = "good" | "warn" | "bad" | "info" | "mute" | "dark";
const TONE: Record<PillTone, { bg: string; fg: string }> = {
  good: { bg: "var(--sport-green-bg)", fg: "var(--sport-green)" },
  warn: { bg: "var(--sport-amber-bg)", fg: "var(--sport-amber)" },
  bad: { bg: "var(--sport-red-bg)", fg: "var(--sport-red)" },
  info: { bg: "var(--sport-tint)", fg: "var(--sport-primary)" },
  mute: { bg: "var(--sport-panel)", fg: "var(--sport-muted)" },
  dark: { bg: "var(--sport-navy)", fg: "#fff" },
};

// Same live regex classification the design's own toneOf() uses, so a real
// status string picks the right tone without a hand-maintained per-status map.
export function toneOf(status: string): PillTone {
  const s = status.toLowerCase();
  if (/(active|confirmed|approved|won|selected|on duty|issued|completed|paid|resolved)/.test(s)) return "good";
  if (/(pending|hold|repair|observation|under care|awaiting|escort|clash|submitted|draft)/.test(s)) return "warn";
  if (/(injured|rejected|condemned|lost|absent|cancelled|overdue)/.test(s)) return "bad";
  if (/(rest|leave|closed|drawn|inactive)/.test(s)) return "mute";
  return "info";
}

export function StatusPill({ label, tone }: { label: string; tone: PillTone }) {
  const t = TONE[tone];
  return (
    <span style={{ display: "inline-block", background: t.bg, color: t.fg, borderRadius: "var(--sport-radius-pill)", padding: "6px 13px", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

const btnBase: CSSProperties = { border: 0, borderRadius: "var(--sport-radius-btn)", height: 44, padding: "0 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
export function PrimaryButton({ children, style, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={`sport-btn-hover-primary${className ? ` ${className}` : ""}`} style={{ ...btnBase, background: "var(--sport-primary)", color: "#fff", ...style }}>
      {children}
    </button>
  );
}
export function SecondaryButton({ children, style, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={`sport-btn-hover-ghost${className ? ` ${className}` : ""}`} style={{ ...btnBase, background: "#fff", color: "var(--sport-ink)", border: "1px solid var(--sport-input-border)", ...style }}>
      {children}
    </button>
  );
}
export function DangerLink({ children, style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} type="button" style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-red)", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", ...style }}>
      {children}
    </button>
  );
}

export function EmptyPanel({ label = "Nothing to show yet." }: { label?: string }) {
  return <div style={{ padding: "44px 20px", textAlign: "center", fontSize: 14, color: "var(--sport-tertiary)", background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)" }}>{label}</div>;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 11, letterSpacing: "0.09em", fontWeight: 700, color: "var(--sport-muted)", textTransform: "uppercase" }}>{children}</div>;
}

const inputBase: CSSProperties = { width: "100%", height: 44, marginTop: 8, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 13px", fontSize: 14, outline: "none", fontFamily: "inherit", color: "var(--sport-ink)" };
export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputBase, ...props.style }} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputBase, background: "#fff", ...props.style }} />;
}
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ width: "100%", marginTop: 8, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "12px 13px", fontSize: 14, lineHeight: 1.6, outline: "none", resize: "vertical", fontFamily: "inherit", color: "var(--sport-ink)", ...props.style }} />;
}

export function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card hover style={{ padding: "20px 22px" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.09em", fontWeight: 700, color: "var(--sport-tertiary-2)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--sport-heading)", marginTop: 8 }}>{value}</div>
      {sub ? <div style={{ fontSize: 12.5, color: "var(--sport-tertiary)", marginTop: 4 }}>{sub}</div> : null}
    </Card>
  );
}
