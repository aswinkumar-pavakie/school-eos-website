// Transport Manager's design-reframe theme -- now realigned to
// brain/SIS Principal/Design Architecture.dc.html, the ONE canonical design
// system for every role login, using the same scoped-CSS-custom-property
// mechanism as ReframeTheme.tsx (Principal/Admin/Vice Principal/Finance):
// every existing token-based component (Shell, KpiCard, StatusPill, every
// ui/ primitive) already reads bg-surface/text-text/border-border/
// rounded-[var(--radius-card)] with zero hardcoded hex values, so redefining
// these custom properties inside this scope class reskins every Transport
// Manager page with zero component code touched. Kept as its own file
// (rather than folded into ReframeTheme.tsx) only because it is applied via
// its own `transportReframeThemeClassName` entry point that Transport
// Manager's layout.tsx already calls -- the values below are now identical
// to ReframeTheme.tsx's, not a distinct system any more.

import { transportReframeSans, reframeMono } from "@/lib/design-reframe-fonts";

export function transportReframeThemeClassName(scope: string): string {
  return `${scope} ${transportReframeSans.variable} ${reframeMono.variable}`;
}

export function TransportReframeThemeStyle({ scope }: { scope: string }) {
  return (
    <style>{`
.${scope} {
  --color-primary: #1f6feb;
  --color-primary-hover: #1a5cc8;
  --color-primary-deep: #1f4fa8;
  --color-navy: #0f2342;
  --color-bg: #fbfcfe;
  --color-surface: #ffffff;
  --color-field: #f6f8fb;
  --color-border: #e4e9f2;
  --color-text: #10243f;
  --color-text-muted: #5c6b82;
  --color-success-bg: #e8f6ee;
  --color-success-text: #1f7a4d;
  --color-text-label: #6b7a91;
  --color-text-secondary: #44536b;
  --color-text-tertiary: #8593a8;
  --color-text-faint: #9aa7ba;
  --color-tile-bg: #f6f8fb;
  --font-sans: var(--font-transport-reframe-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-reframe-mono), ui-monospace, "SFMono-Regular", monospace;
  --radius-pill: 999px;
  --radius-input: 10px;
  --radius-card: 14px;
  --radius-section: 16px;
  --radius-sheet: 18px;
  font-family: var(--font-sans);
}
.${scope} :where(h1, h2, h3) {
  letter-spacing: -0.018em;
}
.${scope} [data-nav-item="active"] {
  background: #eef4ff;
  color: #1f4fa8;
  font-weight: 600;
}
.${scope} [data-nav-item="idle"] {
  color: #3c4a61;
  font-weight: 500;
}
.${scope} [data-nav-item="idle"]:hover {
  background: #f4f7fc;
}
.${scope} [data-nav-item="active"] svg {
  color: #1f6feb;
}
.${scope} [data-nav-item="idle"] svg {
  color: #7d8ca3;
}
.${scope} [data-nav-badge="active"] {
  background: #dbe7ff;
  color: #1f4fa8;
}
.${scope} [data-nav-badge="idle"] {
  background: #f0f3f8;
  color: #5c6b82;
}
.${scope} [data-nav-group-label] {
  color: #9aa7ba;
}
.${scope} .material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  user-select: none;
}
`}</style>
  );
}
