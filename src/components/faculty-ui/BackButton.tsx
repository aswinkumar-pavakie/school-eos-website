import Link from "next/link";
import { ChevronLeftIcon } from "./icons";

// "<- Back to X" ghost button, top-left of drill-in screens (Student detail,
// Schedule class, Recordings, Profile).
export function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="fac-hover-lift inline-flex items-center gap-2"
      style={{
        border: "1px solid var(--fac-border)",
        background: "var(--fac-white)",
        borderRadius: "var(--fac-radius-btn-sm)",
        padding: "10px 15px",
        font: "600 13.5px/1 var(--fac-font-sans)",
        color: "var(--fac-navy)",
      }}
    >
      <ChevronLeftIcon />
      {label}
    </Link>
  );
}
