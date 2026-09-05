// Person/document photoUrl now comes back from the backend as a full Supabase
// Storage public URL (e.g. "https://<project>.supabase.co/storage/v1/object/
// public/person-photos/photos/<uuid>.jpg"), not a path relative to this
// backend's own origin -- so it must be used as-is, never prefixed with the
// API base the way the old "/uploads/*" convention required.
export function resolvePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  if (/^https?:\/\//.test(photoUrl)) return photoUrl;
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1").replace(
    /\/api\/v1\/?$/,
    "",
  );
  return `${apiBase}${photoUrl}`;
}
