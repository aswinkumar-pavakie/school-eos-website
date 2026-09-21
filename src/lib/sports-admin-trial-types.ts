// Trials & selection's own constants/types, split out of sports-admin-api.ts
// (which re-exports them, so every existing server-side import keeps
// working unchanged) because this file has zero runtime dependencies of its
// own -- no `next/headers`, no `apiFetch`, nothing. sports-admin-api.ts
// imports `cookies` from "next/headers" (server-only) at its top, so any
// Client Component that imported a *value* out of it (not just a type) --
// TrialRowActions.tsx importing `TRIAL_ROUNDS` -- pulled that entire module,
// `next/headers` included, into the client bundle, which Next.js refuses to
// build ("You're importing a module that depends on next/headers... only
// available in Server Components"). Client Components needing these values
// import from this file directly instead.
export const TRIAL_ROUNDS = ["ROUND_1", "ROUND_2", "FINAL_ROUND"] as const;
export type TrialRound = (typeof TRIAL_ROUNDS)[number];
export const TRIAL_STATUSES = ["PENDING", "HOLD", "SELECTED", "NOT_SELECTED"] as const;
export type TrialStatus = (typeof TRIAL_STATUSES)[number];

export interface SportsTrial {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  gradeName: string | null;
  sectionName: string | null;
  sportId: string;
  sportName: string;
  round: TrialRound;
  trialDate: string;
  score: string | null;
  status: TrialStatus;
  notes: string | null;
  createdAt: string;
}
