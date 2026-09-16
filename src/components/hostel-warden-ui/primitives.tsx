import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

// Direct ports of the design's own .card/.btn* rules (see the <style> block
// in Warden Console.dc.html) as real components -- base sizing/shape inline,
// hover state via the hw-btn-*/hw-lift classes in hostel-warden-theme.css.

export function Card({ children, style, lift = true }: { children: ReactNode; style?: CSSProperties; lift?: boolean }) {
  return (
    <div className={lift ? "hw-lift" : undefined} style={{ background: "var(--hw-surface)", border: "1px solid var(--hw-divider)", borderRadius: "var(--hw-radius-md)", ...style }}>
      {children}
    </div>
  );
}

const btnBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  height: 36,
  padding: "0 16px",
  border: "1px solid transparent",
  borderRadius: "var(--hw-radius-sm)",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

export function PrimaryButton({ children, style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className="hw-btn-primary" style={{ ...btnBase, background: "var(--hw-accent)", color: "#fff", ...style }}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className="hw-btn-secondary" style={{ ...btnBase, background: "var(--hw-surface)", color: "var(--hw-text)", borderColor: "var(--hw-border-input)", ...style }}>
      {children}
    </button>
  );
}

export function GhostButton({ children, style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className="hw-btn-ghost" style={{ ...btnBase, background: "transparent", ...style }}>
      {children}
    </button>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="hw-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <th scope="col" style={{ padding: "10px 14px", whiteSpace: "nowrap", textAlign: align }}>
      {children}
    </th>
  );
}

export function Td({ children, align = "left", mono, style }: { children: ReactNode; align?: "left" | "right"; mono?: boolean; style?: CSSProperties }) {
  return (
    <td style={{ padding: "10px 14px", textAlign: align, fontFamily: mono ? "ui-monospace, monospace" : undefined, ...style }}>{children}</td>
  );
}

export function EmptyRow({ colSpan, label = "No records under this filter." }: { colSpan: number; label?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0 }}>
        <div style={{ border: "1px dashed #dde2e8", borderRadius: "var(--hw-radius-md)", padding: 44, margin: 14, textAlign: "center", fontSize: 13, color: "var(--hw-text-muted)" }}>{label}</div>
      </td>
    </tr>
  );
}

export type PillTone = "blue" | "amber" | "red" | "gray";

const TONE_STYLES: Record<PillTone, { bg: string; fg: string }> = {
  blue: { bg: "var(--hw-accent-100)", fg: "var(--hw-accent-700)" },
  amber: { bg: "var(--hw-amber-bg)", fg: "var(--hw-amber-text)" },
  red: { bg: "var(--hw-red-bg)", fg: "var(--hw-red-text)" },
  gray: { bg: "var(--hw-panel)", fg: "var(--hw-text-muted)" },
};

export function StatusPill({ label, tone }: { label: string; tone: PillTone }) {
  const t = TONE_STYLES[tone];
  return (
    <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", background: t.bg, color: t.fg }}>
      {label}
    </span>
  );
}

// Matches the design's `chipSet`/tab-pill rendering exactly (20px pill, 1px
// border, 7px/13px padding, 12.5px/600 label) -- used for approval-status
// tabs, priority filters, time-sort chips.
export function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: "unset",
        cursor: "pointer",
        padding: "7px 13px",
        borderRadius: 20,
        whiteSpace: "nowrap",
        fontSize: 12.5,
        fontWeight: 600,
        border: `1px solid ${active ? "var(--hw-accent)" : "var(--hw-divider)"}`,
        background: active ? "var(--hw-accent)" : "#fff",
        color: active ? "#fff" : "#3d4754",
      }}
    >
      {label}
    </button>
  );
}

export function FieldLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 600, color: "var(--hw-text-muted)", ...style }}>
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} style={{ height: 34, fontSize: 13, ...props.style }} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="input" {...props} style={{ height: "auto", minHeight: 84, padding: 10, resize: "vertical", ...props.style }} />;
}
