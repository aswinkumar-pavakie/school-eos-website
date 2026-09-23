"use client";

// Shared stat tile -- identical to faculty-ui/StatTile.tsx, restyled to
// --eos-* tokens so it renders pixel-identically wherever a shared-ui
// feature screen uses it, independent of the surrounding role's own theme.
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
      className={`block w-full text-left ${onClick ? "cursor-pointer" : ""}`}
      style={{
        background: "var(--eos-white)",
        border: "1px solid var(--eos-border)",
        borderRadius: "var(--eos-radius-card)",
        padding: "18px 20px",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <span className="flex items-center justify-between">
        <span style={{ font: "600 14px/1 var(--eos-font-sans)", color: "#475569" }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--eos-tint)", display: "block" }} />
      </span>
      <span style={{ display: "block", font: "700 40px/1.1 var(--eos-font-sans)", marginTop: 12, color: "var(--eos-ink)", overflowWrap: "anywhere" }}>
        {value}
      </span>
      {(strong || sub) && (
        <span style={{ display: "block", font: "400 13px/1.4 var(--eos-font-sans)", color: "#475569", marginTop: 6 }}>
          {strong && <strong style={{ color: "var(--eos-primary)" }}>{strong}</strong>} {sub}
        </span>
      )}
      {pct !== undefined && (
        <span style={{ display: "block", height: 6, borderRadius: 4, background: "var(--eos-border)", marginTop: 12, overflow: "hidden" }}>
          <span style={{ display: "block", height: "100%", background: "var(--eos-primary)", width: pct }} />
        </span>
      )}
      {note && (
        <span style={{ display: "block", font: "400 12px/1.4 var(--eos-font-sans)", color: "var(--eos-tertiary)", marginTop: 10 }}>
          {note}
        </span>
      )}
    </Root>
  );
}
