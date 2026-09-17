// Renders a real Material Symbols Outlined glyph by name -- the exact icon
// system "Transport Module.dc.html" itself uses everywhere (inline
// `font-family:'Material Symbols Outlined'` spans/divs, e.g. line 256's bus
// icon box, line 302-303's Edit/Delete buttons). Font is loaded scoped to
// Transport Manager only (see TransportManagerLayout's own <link> +
// TransportReframeTheme's own .material-symbols-outlined rule) -- this
// component assumes that scope is already on the page; it does not load the
// font itself.

export function MaterialIcon({
  name,
  className,
  size,
  weight = 400,
  fill = 0,
  grade = 0,
}: {
  /** A real Material Symbols Outlined glyph name, e.g. "directions_bus",
   * "edit", "delete" -- verified against the mockup's own literal usage,
   * never guessed. */
  name: string;
  className?: string;
  /** Glyph size in px -- Material Symbols scale by font-size, unlike the old
   * hand-rolled SVGs' h-X/w-X sizing, so every call site sets this to match
   * what it rendered at before. */
  size: number;
  /** Axis overrides -- default 400/0/0 matches the mockup's own default
   * (e.g. line 138's bus icon box); the sidebar nav icon is the one real
   * exception (weight 300, grade -25 -- see layout.tsx's own nav items). */
  weight?: number;
  fill?: number;
  grade?: number;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className ?? ""}`}
      style={{ fontSize: size, fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' ${grade}` }}
      aria-hidden
    >
      {name}
    </span>
  );
}
