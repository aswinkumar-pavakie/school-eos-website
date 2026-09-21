import type { CSSProperties, ReactNode } from "react";

// Pixel-matched value-for-value to faculty-ui/Card.tsx: flat white card,
// 1px var(--can-border) [== --fac-border #e2e8f0], 12px radius, no resting
// shadow -- elevation is the hover-lift alone (.can-hover-lift, copied
// verbatim from .fac-hover-lift in canteen-theme.css).
export function Card({ children, style, hover = false }: { children: ReactNode; style?: CSSProperties; hover?: boolean }) {
  return (
    <div
      className={hover ? "can-hover-lift" : undefined}
      style={{
        background: "var(--can-white)",
        border: "1px solid var(--can-border)",
        borderRadius: "var(--can-radius-card)",
        padding: "18px 20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// A small up/down/flat pill -- "is today better or worse than yesterday",
// the one comparison a single raw number on its own can't answer. null
// deltaPct (no real yesterday baseline) renders a neutral "New" pill
// instead of a fabricated 0%/infinite change.
function DeltaBadge({ deltaPct }: { deltaPct: number | null }) {
  if (deltaPct === null) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", font: "600 11.5px/1 var(--can-font-sans)", color: "var(--can-tertiary)", background: "var(--can-panel)", borderRadius: "var(--can-radius-pill)", padding: "3px 8px" }}>
        New
      </span>
    );
  }
  const up = deltaPct > 0;
  const flat = deltaPct === 0;
  const color = flat ? "var(--can-tertiary)" : up ? "var(--can-green-text)" : "var(--can-red-text)";
  const bg = flat ? "var(--can-panel)" : up ? "var(--can-green-bg)" : "var(--can-red-bg)";
  const arrow = flat ? "" : up ? "▲ " : "▼ ";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", font: "700 11.5px/1 var(--can-font-sans)", color, background: bg, borderRadius: "var(--can-radius-pill)", padding: "3px 8px" }}>
      {arrow}
      {flat ? "No change" : `${Math.abs(deltaPct)}%`}
    </span>
  );
}

// Pixel-matched value-for-value to faculty-ui/StatTile.tsx: eyebrow-weight
// label + icon chip -> big 40px number, same font sizes/weights/colors.
// The source component's own icon chip is a plain decorative color square
// (no glyph); this one renders a real icon inside it instead (same 30x30/
// 8px-radius/--can-tint chip) since Canteen's 4 tiles each mean something
// visually distinct (wallet/receipt/people/trend) -- same spec, more
// legible content, not a deviation from the size/color/font instruction.
// `deltaPct` is new beyond the source component -- a real day-over-day
// comparison (vs yesterday), the single most useful thing a vendor glancing
// at a sales number wants to know that the raw number alone can't say.
export function StatTile({
  label,
  value,
  icon,
  sub,
  deltaPct,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  sub?: string;
  deltaPct?: number | null;
}) {
  return (
    <Card hover style={{ minWidth: 0, overflow: "hidden" }}>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ font: "600 14px/1 var(--can-font-sans)", color: "#475569" }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--can-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </span>
      </span>
      <span style={{ display: "block", font: "700 40px/1.1 var(--can-font-sans)", marginTop: 12, color: "var(--can-ink)", overflowWrap: "anywhere" }}>
        {value}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, minHeight: 20 }}>
        {deltaPct !== undefined && <DeltaBadge deltaPct={deltaPct} />}
        {sub && <span style={{ font: "400 13px/1.4 var(--can-font-sans)", color: "#475569" }}>{sub}</span>}
      </span>
    </Card>
  );
}
