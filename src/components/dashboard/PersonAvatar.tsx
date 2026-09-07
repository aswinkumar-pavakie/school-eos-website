// Shared read-only avatar -- real photo (a Supabase Storage public URL, see
// PersonsController's photo endpoints) or an initials fallback in the same
// shape, so a list row never shifts layout based on whether a photo exists yet.
// "circle" is the compact list/table avatar; "square" is the larger profile-header
// photo (rounded corners, not a full circle).

import { resolvePhotoUrl } from "@/lib/resolve-photo-url";

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function PersonAvatar({
  photoUrl,
  name,
  size = 40,
  shape = "circle",
}: {
  photoUrl: string | null | undefined;
  name: string;
  size?: number;
  shape?: "circle" | "square";
}) {
  const src = resolvePhotoUrl(photoUrl);
  const shapeClass = shape === "square" ? "rounded-[16px]" : "rounded-full";

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- served from a dynamic
    // backend host, not the Next.js image pipeline's own static asset set.
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 border border-border object-cover ${shapeClass}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-primary/10 font-bold text-primary ${shapeClass}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initialsOf(name)}
    </span>
  );
}
