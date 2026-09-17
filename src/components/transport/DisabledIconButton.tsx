"use client";

// A disabled Edit/Delete-style icon affordance sitting inside a row that's
// itself a clickable <Link> (routes/page.tsx's own row-level onOpen, matching
// the mockup). Needs its own onClick to stop that click from navigating
// through it -- event handlers can't be attached in a Server Component, so
// this one small interactive piece is its own Client Component rather than
// converting the whole page (which fetches server-side data) to "use client".

import type { ReactNode } from "react";

export function DisabledIconButton({
  title,
  className,
  style,
  children,
}: {
  title: string;
  className: string;
  style: React.CSSProperties;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className={className}
      style={style}
      onClick={(e) => e.preventDefault()}
    >
      {children}
    </span>
  );
}
