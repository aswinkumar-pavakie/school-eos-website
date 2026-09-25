import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import Link from "next/link";

// Dashboard/detail stat card -- border:1px #E2E8F0, radius 14px, hover-lift
// (see .lib-card-hover in library-theme.css). `highlighted` matches the
// design's one accent card (Overdue books on the Dashboard): border #C7D2E4,
// tint background, navy value, primary sub-copy.
export function StatCard({
  title,
  value,
  sub,
  icon,
  highlighted,
  href,
}: {
  title: string;
  value: ReactNode;
  sub?: ReactNode;
  icon: ReactNode;
  highlighted?: boolean;
  href?: string;
}) {
  const body = (
    <div
      className="lib-card-hover"
      style={{
        border: `1px solid ${highlighted ? "var(--lib-field-border)" : "var(--lib-border)"}`,
        borderRadius: "var(--lib-radius-card)",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        background: highlighted ? "var(--lib-tint)" : "var(--lib-white)",
        height: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ font: "500 16px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{title}</div>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: highlighted ? "var(--lib-white)" : "var(--lib-tint)", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
          {icon}
        </div>
      </div>
      <div style={{ font: "700 40px/1 var(--lib-font-sans)", color: highlighted ? "var(--lib-navy)" : "var(--lib-ink)", overflowWrap: "anywhere" }}>{value}</div>
      {sub && <div style={{ font: "400 14px/1.4 var(--lib-font-sans)", color: highlighted ? "var(--lib-primary)" : "var(--lib-body-muted)" }}>{sub}</div>}
    </div>
  );
  if (!href) return body;
  return (
    <Link href={href} style={{ display: "block", height: "100%" }}>
      {body}
    </Link>
  );
}

// Generic hover-lift panel (report cards, settings sections, dashboard's two
// bottom panels) -- border:1px #E2E8F0, radius 14px, padding 24px.
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="lib-card-hover" style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", padding: "18px 20px", background: "var(--lib-white)", ...style }}>
      {children}
    </div>
  );
}

export type PillTone = "blue" | "amber" | "red" | "green";

// Verbatim port of the design's own pillBg(s)/pillFg(s) switch:
// Overdue/Pending -> amber; Lost/Damaged/Rejected -> red;
// Returned/Clear/Published/Accepted -> green; everything else -> blue tint.
export function pillToneForStatus(status: string): PillTone {
  if (status === "Overdue" || status === "Pending") return "amber";
  if (status === "Lost" || status === "Damaged" || status === "Rejected") return "red";
  if (status === "Returned" || status === "Clear" || status === "Published" || status === "Accepted" || status === "Collected" || status === "Settled") return "green";
  return "blue";
}

const TONE_STYLES: Record<PillTone, { bg: string; fg: string }> = {
  blue: { bg: "var(--lib-tint)", fg: "var(--lib-primary)" },
  amber: { bg: "var(--lib-amber-bg)", fg: "var(--lib-amber-text)" },
  red: { bg: "var(--lib-red-bg)", fg: "var(--lib-red)" },
  green: { bg: "var(--lib-green-bg)", fg: "var(--lib-green-text)" },
};

export function Pill({ label, tone }: { label: string; tone?: PillTone }) {
  const t = TONE_STYLES[tone ?? pillToneForStatus(label)];
  return (
    <span style={{ display: "inline-block", padding: "6px 12px", borderRadius: "var(--lib-radius-pill)", font: "600 12.5px/1.3 var(--lib-font-sans)", background: t.bg, color: t.fg }}>
      {label}
    </span>
  );
}

// Search/select filter inputs are NOT defined here -- every list page reuses
// the app's existing AutoSubmitSearchInput/AutoSubmitSelect
// (@/components/dashboard/AutoSubmitFilter), styled per-page with the
// design's own inline style object, so filtering stays a real server-side
// GET-form submit (searchParams-driven, works with plain <form>, no new
// client state) exactly like every other role's list screens already do.

// Table wrapper -- 1px border, radius 12px, overflow-x auto, matches every
// list screen's table container exactly.
export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-table)", overflowX: "auto", overflowY: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>{children}</table>
    </div>
  );
}

export function Th({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <th style={{ textAlign: align, padding: "14px 18px", font: "600 11px/1.4 var(--lib-font-sans)", letterSpacing: ".08em", color: "var(--lib-body-muted)", textTransform: "uppercase" }}>
      {children}
    </th>
  );
}

export function Td({ children, align = "left", mono, style }: { children: ReactNode; align?: "left" | "right"; mono?: boolean; style?: CSSProperties }) {
  return (
    <td
      style={{
        padding: "16px 18px",
        borderTop: "1px solid var(--lib-border)",
        textAlign: align,
        verticalAlign: "top",
        font: mono ? "400 14px/1.5 var(--lib-font-mono)" : "400 15px/1.4 var(--lib-font-sans)",
        color: "var(--lib-body)",
        ...style,
      }}
    >
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, label = "No records found." }: { colSpan: number; label?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: "64px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <svg width="34" height="34" viewBox="0 0 20 20" fill="none" stroke="#dfe5ef" strokeWidth={1.4}>
            <circle cx="9" cy="9" r="5.6" />
            <path d="M13.2 13.2L17 17" />
          </svg>
          <div style={{ font: "600 19px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{label}</div>
        </div>
      </td>
    </tr>
  );
}

export function Breadcrumb({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, font: "400 15px/1.2 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
      <Link href="/library" className="lib-link-hover" style={{ color: "var(--lib-primary)" }}>
        Home
      </Link>
      <span>›</span>
      <span>{label}</span>
    </div>
  );
}

export function PrimaryButton({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="lib-btn-primary"
      style={{ padding: "11px 18px", border: 0, borderRadius: 10, background: "var(--lib-primary)", color: "#fff", font: "600 14px/1.2 var(--lib-font-sans)", cursor: "pointer", ...rest.style }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="lib-surface-hover"
      style={{ padding: "11px 18px", border: "1px solid var(--lib-border)", borderRadius: 10, background: "var(--lib-white)", color: "var(--lib-navy)", font: "600 14px/1.2 var(--lib-font-sans)", cursor: "pointer", ...rest.style }}
    >
      {children}
    </button>
  );
}
