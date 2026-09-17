// Transport Manager's own design-reframe theme -- real values extracted from
// "Transport Module.dc.html" (the approved SIS Transport mockup export), the
// same scoped-CSS-custom-property mechanism as ReframeTheme.tsx (Principal/
// Admin/Vice Principal's own reframe): every existing token-based component
// (Shell, KpiCard, StatusPill, every ui/ primitive) already reads
// bg-surface/text-text/border-border/rounded-[var(--radius-card)] with zero
// hardcoded hex values, so redefining these custom properties inside this
// scope class reskins every Transport Manager page with zero component code
// touched. Kept as its own file rather than reusing ReframeTheme.tsx because
// the actual palette and font are genuinely different (Plus Jakarta Sans +
// #1D4ED8 blue here, vs. Outfit + #1f6feb there) -- not a copy-paste
// duplicate, a distinct real design system for a distinct login.
//
// Values checked against the mockup's own literal inline styles, not
// inferred: accent #1D4ED8 / accentSoft #EFF4FF (Transport Module.dc.html
// line 1049-1050), page background #FFFFFF flat (no separate off-white page
// tone -- the mockup's own <body> and root div both use #FFFFFF, unlike
// Principal's off-white bg / white card split), text #0F172A / muted #64748B
// / faint #94A3B8, card border #E2E8F0/#E8EDF3, active sidebar item bg
// #F4F6F9 with text #0F172A weight 700 (no colored left bar despite the
// markup's own now-unused box-shadow property -- every real nav row in the
// mockup sets bar: 'transparent').

import { transportReframeSans, reframeMono } from "@/lib/design-reframe-fonts";

export function transportReframeThemeClassName(scope: string): string {
  return `${scope} ${transportReframeSans.variable} ${reframeMono.variable}`;
}

export function TransportReframeThemeStyle({ scope }: { scope: string }) {
  return (
    <style>{`
.${scope} {
  --color-primary: #1D4ED8;
  --color-primary-deep: #1E3A8A;
  --color-bg: #ffffff;
  --color-surface: #ffffff;
  --color-field: #F8FAFC;
  --color-border: #E2E8F0;
  --color-text: #0F172A;
  --color-text-muted: #64748B;
  --color-success-bg: #e8f6ee;
  --color-success-text: #1f7a4d;
  --color-text-label: #64748B;
  --color-text-secondary: #334155;
  --color-text-tertiary: #64748B;
  --color-text-faint: #94A3B8;
  --color-tile-bg: #F8FAFC;
  --font-sans: var(--font-transport-reframe-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-reframe-mono), ui-monospace, "SFMono-Regular", monospace;
  --radius-pill: 999px;
  --radius-input: 10px;
  --radius-card: 16px;
  --radius-section: 16px;
  --radius-sheet: 18px;
  font-family: var(--font-sans);
}
.${scope} :where(h1, h2, h3) {
  letter-spacing: -0.02em;
}
.${scope} [data-nav-item="active"] {
  background: #F4F6F9;
  color: #0F172A;
  font-weight: 700;
}
.${scope} [data-nav-item="idle"] {
  color: #475569;
  font-weight: 600;
}
.${scope} [data-nav-item="idle"]:hover {
  background: #F8FAFC;
}
.${scope} [data-nav-item="active"] svg {
  color: #1D4ED8;
}
.${scope} [data-nav-item="idle"] svg {
  color: #64748B;
}
.${scope} [data-nav-badge="active"] {
  background: #ffffff;
  color: #64748B;
}
.${scope} [data-nav-badge="idle"] {
  background: #F1F5F9;
  color: #64748B;
}
.${scope} [data-nav-group-label] {
  color: #94A3B8;
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
