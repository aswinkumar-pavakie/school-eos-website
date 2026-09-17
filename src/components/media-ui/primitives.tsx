import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

export function Card({ children, style, hover = false, onClick }: { children: ReactNode; style?: CSSProperties; hover?: boolean; onClick?: () => void }) {
  return (
    <div
      className={hover ? "media-card-hover" : undefined}
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid var(--med-border)",
        borderRadius: "var(--med-radius-card)",
        padding: "22px 24px",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export type PillTone = "blue" | "green" | "amber" | "red" | "gray";
const TONE: Record<PillTone, { bg: string; fg: string }> = {
  blue: { bg: "var(--med-tint)", fg: "var(--med-primary)" },
  green: { bg: "var(--med-green-bg)", fg: "var(--med-green)" },
  amber: { bg: "var(--med-amber-bg)", fg: "var(--med-amber)" },
  red: { bg: "var(--med-red-bg)", fg: "var(--med-red)" },
  gray: { bg: "var(--med-panel)", fg: "var(--med-body)" },
};
export function StatusPill({ label, tone }: { label: string; tone: PillTone }) {
  const t = TONE[tone];
  return (
    <span style={{ display: "inline-block", background: t.bg, color: t.fg, borderRadius: "var(--med-radius-pill)", padding: "6px 13px", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

const btnBase: CSSProperties = { border: 0, borderRadius: "var(--med-radius-btn)", height: 48, padding: "0 22px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };
export function PrimaryButton({ children, style, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={`media-btn-hover-navy${className ? ` ${className}` : ""}`} style={{ ...btnBase, background: "var(--med-navy)", color: "#fff", ...style }}>
      {children}
    </button>
  );
}
export function SecondaryButton({ children, style, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={`media-btn-hover-ghost${className ? ` ${className}` : ""}`} style={{ ...btnBase, background: "#fff", color: "var(--med-ink)", border: "1px solid #d9dee7", ...style }}>
      {children}
    </button>
  );
}

export function EmptyPanel({ label = "Nothing to show yet." }: { label?: string }) {
  return <div style={{ padding: "44px 20px", textAlign: "center", fontSize: 14, color: "var(--med-tertiary)", background: "#fff", border: "1px solid var(--med-border)", borderRadius: "var(--med-radius-card)" }}>{label}</div>;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-primary)" }}>{children}</div>;
}

const inputBase: CSSProperties = { width: "100%", height: 48, marginTop: 10, border: "1px solid var(--med-input-border)", borderRadius: 12, padding: "0 14px", fontSize: 14.5, outline: "none", fontFamily: "inherit", color: "var(--med-ink)" };
export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputBase, ...props.style }} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputBase, background: "#fff", ...props.style }} />;
}
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ width: "100%", marginTop: 10, border: "1px solid var(--med-input-border)", borderRadius: 12, padding: "14px 16px", fontSize: 14.5, lineHeight: 1.6, outline: "none", resize: "vertical", fontFamily: "inherit", color: "var(--med-ink)", ...props.style }} />;
}
