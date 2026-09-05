import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-text-muted transition-colors hover:text-primary"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
        <path d="M15 5 8.5 12l6.5 7" />
      </svg>
      {label}
    </Link>
  );
}
