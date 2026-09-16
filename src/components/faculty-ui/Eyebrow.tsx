import type { ReactNode } from "react";

// The design's universal "eyebrow" caption label -- used 83 times across the
// .dc.html with the exact same style, always uppercase copy. Build once.
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`uppercase ${className}`}
      style={{
        font: "600 11px/1 var(--fac-font-sans)",
        letterSpacing: ".09em",
        color: "var(--fac-tertiary)",
      }}
    >
      {children}
    </div>
  );
}
