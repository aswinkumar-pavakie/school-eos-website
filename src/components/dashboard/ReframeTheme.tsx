// Shared design-reframe theme -- the exact palette/fonts/radii from
// style.specs and the approved SIS mockup exports, scoped via a wrapper CSS
// class so it cascades through every existing token-based component (Shell,
// KpiCard, StatusPill, every ui/ primitive already uses bg-surface/text-text/
// border-border/rounded-[var(--radius-card)] with zero hardcoded hex values)
// with no component code touched. Originally built for Principal alone; now
// shared so Admin and Vice Principal's own layouts can apply the identical
// look via their own scope class, per the user's explicit "change the
// components in admin and vice_principal also" instruction. Each role's own
// nav/data/functionality is untouched -- this only ever redefines CSS custom
// properties + loads fonts inside that role's own DOM subtree.

import { reframeSans, reframeMono } from "@/lib/design-reframe-fonts";

export function reframeThemeClassName(scope: string): string {
  return `${scope} ${reframeSans.variable} ${reframeMono.variable}`;
}

export function ReframeThemeStyle({ scope }: { scope: string }) {
  return (
    <style>{`
.${scope} {
  --color-primary: #1f6feb;
  --color-primary-hover: #1a5cc8;
  --color-primary-deep: #1f4fa8;
  --color-navy: #0f2342;
  --color-bg: #fbfcfe;
  --color-surface: #ffffff;
  --color-field: #f8fafc;
  --color-border: #e4e9f2;
  --color-text: #10243f;
  --color-text-muted: #5c6b82;
  --color-success-bg: #e8f6ee;
  --color-success-text: #1f7a4d;
  /* Extra text tones from style.specs, not covered by the base app's 2-tone
     text/text-muted pair -- used by KpiCard's label/sub/note lines to match
     the mockup source exactly (checked against Principal Console.dc.html's
     actual stat-card markup, not inferred from the spec's prose). */
  --color-text-label: #6b7a91;
  --color-text-secondary: #44536b;
  --color-text-tertiary: #8593a8;
  --color-text-faint: #9aa7ba;
  /* Filled tile background used by ProfileHeader's stat tiles and detail-page
     metric tiles in the mockup's isHero block (Principal Console.dc.html line
     325) -- a flat fill, not the bordered-card look those tiles used before. */
  --color-tile-bg: #f6f8fb;
  --font-sans: var(--font-reframe-sans), ui-sans-serif, system-ui, sans-serif;
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
/* Sidebar nav exact colors from Principal Console.dc.html's own nav-item markup --
   kept as scoped attribute-selector overrides (not global Shell.tsx classes) so
   Admin/Finance/Library outside a reframed scope keep their existing bg-primary/10
   nav styling untouched; only .${scope}'s own sidebar gets these exact hex values. */
.${scope} [data-nav-item="active"] {
  background: #eef4ff;
  color: #1f4fa8;
}
.${scope} [data-nav-item="idle"] {
  color: #3c4a61;
}
.${scope} [data-nav-item="idle"]:hover {
  background: #f4f7fc;
}
/* Icon stroke color via descendant selector (not a prop on the icon component
   itself, which is typed with no room for extra attributes) -- targets the
   svg inside the already-tagged nav item. */
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
`}</style>
  );
}
