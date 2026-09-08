// Kept in its own module, deliberately separate from parent-api.ts: this is
// a plain compile-time constant with zero server-only imports, safe for a
// Client Component to import directly. parent-api.ts itself is Server-only
// (it imports apiFetch, which depends on next/headers) -- a Client Component
// importing anything from it, even a plain constant, pulls that whole
// module's import graph into the client bundle, which Next.js correctly
// refuses to build.

export const DOCUMENT_TYPES = [
  "BONAFIDE_CERTIFICATE",
  "TRANSFER_CERTIFICATE",
  "CHARACTER_CERTIFICATE",
  "STUDY_CERTIFICATE",
  "FEE_STRUCTURE_CERTIFICATE",
  "MIGRATION_CERTIFICATE",
  "DUPLICATE_MARKSHEET",
  "CONDUCT_CERTIFICATE",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
