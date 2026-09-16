// Colored-initials avatar -- the design never uses a real photo, always 1-2
// uppercase initials in a circle. "parent"/"student" tone = light blue bg /
// blue text; "staff" tone = solid navy bg / white text (the teacher herself,
// e.g. the sidebar footer "MR").
const SIZES = { xs: 34, sm: 36, md: 38, lg: 40, xl: 104, xxl: 118 } as const;

export function Avatar({
  initials,
  size = "md",
  tone = "parent",
}: {
  initials: string;
  size?: keyof typeof SIZES;
  tone?: "parent" | "student" | "staff";
}) {
  const px = SIZES[size];
  const staff = tone === "staff";
  return (
    <span
      style={{
        width: px,
        height: px,
        flex: `0 0 ${px}px`,
        borderRadius: "50%",
        background: staff ? "var(--fac-navy)" : "var(--fac-tint)",
        color: staff ? "#fff" : "var(--fac-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        font: `600 ${Math.max(11, Math.round(px * 0.34))}px/1 var(--fac-font-sans)`,
      }}
    >
      {initials}
    </span>
  );
}
