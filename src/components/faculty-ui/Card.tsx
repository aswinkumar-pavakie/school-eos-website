"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// The design's single most-repeated pattern (136 instances): a flat white
// card, 1px #e2e8f0 border, 12px radius, that lifts 3-5px with a soft blue
// outline on hover -- never a resting shadow. `interactive` toggles that
// hover behavior (via the .fac-hover-lift class in faculty-theme.css,
// replacing the source's non-standard style-hover attribute with real CSS).
type CommonProps = {
  interactive?: boolean;
  padding?: string;
  radius?: string;
  className?: string;
  children: ReactNode;
};

function cardStyle(padding?: string, radius?: string): React.CSSProperties {
  return {
    background: "var(--fac-white)",
    border: "1px solid var(--fac-border)",
    borderRadius: radius ?? "var(--fac-radius-card)",
    padding: padding ?? "18px 20px",
  };
}

export function Card({
  interactive,
  padding,
  radius,
  className = "",
  children,
  href,
  onClick,
  ...rest
}: CommonProps & {
  href?: string;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
}) {
  const cls = `${interactive ? "fac-hover-lift cursor-pointer" : ""} ${className}`.trim();
  const style = cardStyle(padding, radius);

  if (href) {
    return (
      <Link href={href} className={`block ${cls}`} style={style}>
        {children}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`block w-full text-left ${cls}`}
        style={style}
        {...rest}
      >
        {children}
      </button>
    );
  }
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}
