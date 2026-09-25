import Link from "next/link";
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

// Pixel-matched generic register table -- exact th/td paddings, fonts and
// colors from the design's own cell()/renderVals() column-style generators
// (Sports Admin School.dc.html lines ~1306-1346). Every list screen
// (Teams, Sessions, Fixtures, Achievements, OD, Coaches, Equipment, Indents,
// Houses, Students) renders through this one component so the table look
// never drifts screen to screen, same as the design's own single generic
// table renderer.
export type TableCell =
  | { kind: "plain"; text: string; bold?: boolean; mono?: boolean }
  | { kind: "badge"; text: string; tone: PillTone }
  // For an interactive per-row action (e.g. the design's own "MANAGE"
  // column) -- never used together with `rowHref` on the same table (a
  // button can't nest inside the per-cell Link that makes an href'd row
  // clickable), same reason thStyle already right-aligns a "MANAGE" header.
  | { kind: "node"; node: ReactNode };

export function TableCard({
  title,
  meta,
  columns,
  rows,
  rowHref,
  emptyLabel = "No records yet.",
}: {
  title: string;
  meta?: string;
  columns: string[];
  rows: { key: string; cells: TableCell[] }[];
  rowHref?: (rowKey: string) => string;
  emptyLabel?: string;
}) {
  const thStyle = (label: string): CSSProperties => ({
    padding: "13px 26px",
    textAlign: label === "MANAGE" ? "right" : "left",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.09em",
    color: "var(--sport-tertiary-2)",
    whiteSpace: "nowrap",
  });
  // td itself carries no padding when a row is a link -- valid HTML forbids
  // an <a> wrapping a <tr>/<td> (confirmed live: it silently breaks React
  // hydration, the table re-renders empty on the client). Instead each cell's
  // content is wrapped in its own Link, styled to fill the cell exactly like
  // the padded span it replaces, so the whole row still reads/behaves as one
  // click target without invalid nesting.
  const tdPadding = "16px 26px";
  const tdStyle: CSSProperties = { padding: rowHref ? 0 : tdPadding, fontSize: 14, color: "var(--sport-body)", verticalAlign: "middle", whiteSpace: "nowrap" };
  const linkFillStyle: CSSProperties = { display: "block", padding: tdPadding, textDecoration: "none", color: "inherit" };

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "22px 26px 16px" }}>
        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "var(--sport-heading)" }}>{title}</h2>
        {meta ? <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--sport-tertiary-2)" }}>{meta}</span> : null}
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: 26, fontSize: 13.5, color: "var(--sport-tertiary-3)" }}>{emptyLabel}</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr style={{ background: "#fff" }}>
                {columns.map((c) => (
                  <th key={c} style={thStyle(c)}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.key} className="sport-row-hover" style={{ borderTop: i > 0 ? "1px solid var(--sport-divider)" : undefined, cursor: rowHref ? "pointer" : undefined }}>
                  {row.cells.map((cell, ci) => {
                    const content =
                      cell.kind === "badge" ? (
                        <StatusPill label={cell.text} tone={cell.tone} />
                      ) : cell.kind === "node" ? (
                        cell.node
                      ) : (
                        <span style={cell.bold ? { fontWeight: 700, color: "var(--sport-ink)" } : cell.mono ? { fontFamily: "var(--sport-mono)", fontSize: 12.5, color: "var(--sport-muted-2)" } : undefined}>
                          {cell.text}
                        </span>
                      );
                    return (
                      <td key={ci} style={cell.kind === "node" ? { ...tdStyle, padding: tdPadding, textAlign: "right" } : tdStyle}>
                        {rowHref && cell.kind !== "node" ? <Link href={rowHref(row.key)} style={linkFillStyle}>{content}</Link> : content}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Pixel-matched to page.stats' own card spec (design line ~96-112):
// label 11px/0.1em, value 38px/800/-0.02em, line1 13.5px #4E5D70, line2
// 12.5px #98A3B2 -- the one stat-tile block the design reuses on Dashboard,
// Houses and everywhere else `page.hasStats` is true.
//
// The fixed 38px value size assumed short values (counts like "2", "12").
// A long alphanumeric value (a register/admission number) at that size
// overflowed its own card into the next one once the page's own content
// width could shrink -- the AI chat panel's "push" layout (AskAiWidget)
// made this visible for the first time, but the bug was really that this
// card never adapted to its own width at all. Fixed two ways: the grid
// item itself is now allowed to shrink below its content's natural
// min-content width (minWidth: 0 -- a plain CSS grid item defaults to
// min-width: auto, which is exactly what was forcing the column wider
// than its 1fr share instead of letting the text wrap), and the value's
// own font size now scales down for longer strings so it fits its card at
// any width instead of relying on wrapping alone.
function valueFontSize(value: string | number): number {
  const length = String(value).length;
  if (length > 10) return 20;
  if (length > 7) return 26;
  return 38;
}

export function StatTile({ label, value, sub, sub2, bar }: { label: string; value: string | number; sub?: string; sub2?: string; /** Real 0-100 value driving a thin progress bar under the metric value -- same pattern as components/dashboard/KpiCard.tsx's own `bar` prop. Omit for cards with no ratio to visualize. */ bar?: number }) {
  return (
    <Card hover style={{ padding: "20px 22px", minWidth: 0, overflow: "hidden" }}>
      <div style={{ fontSize: 11, letterSpacing: "0.1em", fontWeight: 700, color: "var(--sport-tertiary-2)" }}>{label}</div>
      <div
        style={{
          fontSize: valueFontSize(value),
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--sport-heading)",
          marginTop: 6,
          lineHeight: 1.15,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
      {bar !== undefined && (
        <div style={{ marginTop: 10, height: 6, borderRadius: 4, overflow: "hidden", background: "var(--sport-border)" }}>
          <div style={{ height: "100%", borderRadius: 4, width: `${Math.max(0, Math.min(100, bar))}%`, background: "var(--sport-primary)" }} />
        </div>
      )}
      {sub ? <div style={{ fontSize: 13.5, color: "var(--sport-body-muted)", marginTop: 4 }}>{sub}</div> : null}
      {sub2 ? <div style={{ fontSize: 12.5, color: "var(--sport-tertiary-3)", marginTop: 2 }}>{sub2}</div> : null}
    </Card>
  );
}
