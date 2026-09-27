"use client";

// Matches the design's dashboard/students stat-tile exactly: eyebrow-weight
// label + icon chip -> big number -> strong-colored sub-copy -> 6px progress
// bar -> muted note. Clickable (filters a list below) or static.
export function StatTile({
  label,
  value,
  strong,
  sub,
  pct,
  note,
  onClick,
}: {
  label: string;
  value: string;
  strong?: string;
  sub?: string;
  pct?: string;
  note?: string;
  onClick?: () => void;
}) {
  const Root = onClick ? "button" : "div";
  return (
    <Root
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`fac-hover-lift block w-full text-left ${onClick ? "cursor-pointer" : ""}`}
      style={{
        background: "var(--fac-white)",
        border: "1px solid var(--fac-border)",
        borderRadius: "var(--fac-radius-card)",
        padding: "18px 20px",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <span className="flex items-center justify-between">
        <span style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: "0.11em", textTransform: "uppercase", color: "#6b7a91" }}>{label}</span>
        <span
          style={{ width: 30, height: 30, borderRadius: 8, background: "var(--fac-tint)", display: "block" }}
        />
      </span>
      <span style={{ display: "block", font: "700 40px/1.1 var(--fac-font-sans)", marginTop: 12, color: "var(--fac-ink)", overflowWrap: "anywhere" }}>
        {value}
      </span>
      {(strong || sub) && (
        <span style={{ display: "block", font: "400 13px/1.4 var(--fac-font-sans)", color: "#44536b", marginTop: 6 }}>
          {strong && <strong style={{ color: "var(--fac-primary)" }}>{strong}</strong>} {sub}
        </span>
      )}
      {pct !== undefined && (
        <span
          style={{
            display: "block",
            height: 6,
            borderRadius: 4,
            background: "var(--fac-border)",
            marginTop: 12,
            overflow: "hidden",
          }}
        >
          <span style={{ display: "block", height: "100%", background: "var(--fac-primary)", width: pct }} />
        </span>
      )}
      {note && (
        <span style={{ display: "block", font: "400 12px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 10 }}>
          {note}
        </span>
      )}
    </Root>
  );
}
