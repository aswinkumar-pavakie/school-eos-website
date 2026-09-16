// Client-safe constants split out of hostel-warden-api.ts -- that file
// imports apiFetch from ./api, which pulls in next/headers and can only be
// imported by Server Components/Actions. A "use client" component that
// needs one of these constants (not just a type) must import it from here
// instead, or the whole server-only module graph gets pulled into the
// client bundle and the production build fails. hostel-warden-api.ts
// re-exports everything here too, so server-side callers can keep using one
// import path.

export type NightAttendanceStatus = "PRESENT" | "ABSENT";

// Matches complaint.category's real, live CHECK constraint's use here -- every
// hostel complaint's finer-grained kind is `issueType`, not `category`. Keep
// in sync with school-eos-backend's create-hostel-complaint.dto.ts
// HOSTEL_ISSUE_TYPES.
export const HOSTEL_ISSUE_TYPES = [
  "ELECTRICAL",
  "PLUMBING",
  "WATER_LEAKAGE",
  "BATHROOM",
  "FURNITURE_DAMAGE",
  "CLEANING",
  "OTHER",
] as const;
export type HostelIssueType = (typeof HOSTEL_ISSUE_TYPES)[number];

export const HOSTEL_ISSUE_TYPE_LABELS: Record<HostelIssueType, string> = {
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
  WATER_LEAKAGE: "Water leakage",
  BATHROOM: "Bathroom",
  FURNITURE_DAMAGE: "Furniture damage",
  CLEANING: "Cleaning",
  OTHER: "Other",
};

// Matches complaint.state's real, live CHECK constraint exactly -- no ASSIGNED
// value exists on the real table. Keep in sync with
// update-hostel-complaint.dto.ts.
export const HOSTEL_COMPLAINT_STATES = ["OPEN", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED", "REJECTED"] as const;
export type HostelComplaintState = (typeof HOSTEL_COMPLAINT_STATES)[number];

// Mirrors ComplaintsService's own ALLOWED_TRANSITIONS on the backend exactly,
// so the UI only ever offers a transition the backend will actually accept
// (a 409 is still handled if this ever drifts, since the backend remains the
// real source of truth).
export const HOSTEL_COMPLAINT_ALLOWED_TRANSITIONS: Record<HostelComplaintState, HostelComplaintState[]> = {
  OPEN: ["IN_PROGRESS", "ESCALATED", "REJECTED", "CLOSED"],
  IN_PROGRESS: ["RESOLVED", "ESCALATED", "CLOSED"],
  ESCALATED: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
  REJECTED: [],
};
