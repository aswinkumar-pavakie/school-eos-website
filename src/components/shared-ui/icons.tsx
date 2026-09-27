// Shared-ui's own tiny icon set -- identical paths to faculty-ui/icons.tsx's
// ChevronLeftIcon/ChevronRightIcon, duplicated here so shared-ui never
// depends on importing FROM a specific role's own component folder (that
// would make "shared" secretly mean "faculty-ui with extra steps").

interface IconProps {
  className?: string;
}

const base = { viewBox: "0 0 24 24", fill: "none" as const, xmlns: "http://www.w3.org/2000/svg" };

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} width="16" height="16" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base} width="16" height="16" stroke="#8593a8" strokeWidth={2} className={className} aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
