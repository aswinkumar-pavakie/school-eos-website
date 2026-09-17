// The design's status pill: radius 20px, blue = positive/neutral (present,
// paid, signed, approved, completed), red = negative (absent, overdue,
// rejected, declined), gray = pending/neutral-inactive. Deliberately 2-tone
// (+gray) -- not the sitewide 3-tone src/components/ui/StatusPill.
const TONES = {
  blue: { bg: "var(--fac-tint)", fg: "var(--fac-primary)" },
  red: { bg: "var(--fac-red-bg)", fg: "var(--fac-red-text)" },
  gray: { bg: "var(--fac-divider)", fg: "var(--fac-body)" },
  navy: { bg: "var(--fac-tint)", fg: "var(--fac-navy)" },
} as const;

export function StatusPill({
  tone,
  children,
  size = "md",
}: {
  tone: keyof typeof TONES;
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  const t = TONES[tone];
  return (
    <span
      style={{
        display: "inline-block",
        borderRadius: "var(--fac-radius-pill)",
        padding: size === "sm" ? "6px 11px" : "7px 13px",
        font: `600 ${size === "sm" ? "11px" : "12.5px"}/1 var(--fac-font-sans)`,
        background: t.bg,
        color: t.fg,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
