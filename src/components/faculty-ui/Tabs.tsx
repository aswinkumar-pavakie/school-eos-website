"use client";

import Link from "next/link";

// Segmented tab bar, 2 visual variants from the design:
// "outline" -- white container (1px border), active tab fills solid blue/white text.
//   Used by Approve leave, Ask permissions, Library, Current term.
// "tint"    -- light-blue container (no border), active tab is a white pill/blue text.
//   Used by Homework/Assignment detail panels.
//
// Works from a Server Component too: give each item an `href` (a plain
// string, computed by the caller) instead of relying on `onChange`, for
// pages that keep tab state in the URL. IMPORTANT: this must be a precomputed
// string per item, never a function -- Next.js forbids passing a plain
// closure from a Server Component into a Client Component's props (only a
// real Server Action, marked "use server", is allowed to cross that
// boundary). An earlier version of this component took a `hrefFor: (key) =>
// string` callback prop instead, which crashed at runtime on every
// Server-Component call site ("Functions cannot be passed directly to
// Client Components...") -- confirmed live, fixed by moving the string
// computation to each caller instead.
export type TabItem = { key: string; label: string; href?: string };

export function Tabs({
  items,
  activeKey,
  onChange,
  variant = "outline",
}: {
  items: TabItem[];
  activeKey: string;
  onChange?: (key: string) => void;
  variant?: "outline" | "tint";
}) {
  const containerStyle: React.CSSProperties =
    variant === "outline"
      ? { background: "var(--fac-white)", border: "1px solid var(--fac-border)" }
      : { background: "var(--fac-tint)" };

  return (
    <div
      className="fac-hover-lift"
      style={{
        display: "flex",
        gap: 8,
        borderRadius: 11,
        padding: 5,
        width: "fit-content",
        ...containerStyle,
      }}
    >
      {items.map((item) => {
        const active = item.key === activeKey;
        const bg =
          variant === "outline"
            ? active
              ? "var(--fac-primary)"
              : "transparent"
            : active
              ? "var(--fac-white)"
              : "transparent";
        const fg =
          variant === "outline" ? (active ? "#fff" : "var(--fac-body)") : active ? "var(--fac-primary)" : "var(--fac-body)";
        const style: React.CSSProperties = {
          border: 0,
          cursor: "pointer",
          borderRadius: 8,
          padding: "11px 26px",
          font: "600 14px/1 var(--fac-font-sans)",
          background: bg,
          color: fg,
          whiteSpace: "nowrap",
          display: "inline-block",
        };
        if (item.href !== undefined) {
          return (
            <Link key={item.key} href={item.href} style={style}>
              {item.label}
            </Link>
          );
        }
        return (
          <button key={item.key} type="button" onClick={() => onChange?.(item.key)} style={style}>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
