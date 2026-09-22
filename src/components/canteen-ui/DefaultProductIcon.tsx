// A professional, canteen-themed placeholder for a product with no photo
// (image is explicitly optional per the requirement) -- a plated
// meal/utensils glyph on the same --can-tint background every other icon
// chip in this portal uses, never a broken image or a generic gray box.
export function DefaultProductIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--can-primary)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M8 9c0-1.5.6-3 1.2-3M8 9c0 1 .3 2 1 2.5M8 9h0" />
      <path d="M7.2 6c.5 0 .9.6.9 3s-.4 3-.9 3" />
      <path d="M16 6v6.5a1.5 1.5 0 0 1-3 0V6" />
      <path d="M14.5 6v3.5" />
    </svg>
  );
}
