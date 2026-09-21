// Sports Admin -- a real, dedicated, school-wide login role (SPORTS_ADMIN,
// see database/migrations/0019_sports_admin_role.sql), distinct from the
// existing SPORTS_FACULTY scope tag that /sports (Faculty's own, one-sport-
// scoped view) uses. Every backend module below was broadened to accept
// SPORTS_ADMIN alongside its existing roles (confirmed by direct backend
// audit this session), and the sports-domain services (teams/training/
// tournaments/achievements/profiles/equipment/od/indents) now resolve
// SPORTS_ADMIN as authorized for every real sport, not just an assigned one
// -- see sports-faculty.repository.ts's own header comment.
//
// Re-exports every already-real Faculty-scoped Sports function unchanged
// (same functions, same shapes -- what differs is only which sports they
// return for, decided server-side by role) rather than duplicating a
// parallel client.

export * from "./sports-faculty-api";

import { apiFetch, AuthExpiredError } from "./api";

interface ApiEnvelope<T> {
  data: T;
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  if (res.status === 401) throw new AuthExpiredError();
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

// ---------- Sports master data (sport/category) ----------

export interface Sport {
  id: string;
  name: string;
  sportType: string;
  resultType: string;
  scoringTemplate: Record<string, unknown>;
  status: string;
}

export async function listSports(): Promise<Sport[]> {
  const res = await apiFetch("/sports");
  return (await parseOrThrow<ApiEnvelope<Sport[]>>(res)).data;
}

export interface SportCategory {
  id: string;
  sportId: string;
  name: string;
  ageGroup: string | null;
  gender: string | null;
}
export async function listSportCategories(sportId: string): Promise<SportCategory[]> {
  const res = await apiFetch(`/sports/${sportId}/categories`);
  return (await parseOrThrow<ApiEnvelope<SportCategory[]>>(res)).data;
}

// ---------- Coaches & PT staff ----------

export interface Coach {
  id: string;
  personId: string | null;
  fullName: string;
  isExternal: boolean;
  contactPhone: string | null;
  qualification: string | null;
  policeVerificationRef: string | null;
  verificationExpiry: string | null;
  status: string;
  createdAt: string;
}

export async function listCoaches(): Promise<Coach[]> {
  const res = await apiFetch("/coaches");
  return (await parseOrThrow<ApiEnvelope<Coach[]>>(res)).data;
}

export async function createCoach(input: { fullName: string; personId?: string; isExternal?: boolean; contactPhone?: string; qualification?: string }): Promise<Coach> {
  const res = await apiFetch("/coaches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Coach>>(res)).data;
}

// Edit already real (PATCH /coaches/:id); "Delete" reuses the same route
// with status='INACTIVE' -- no hard-delete route exists.
export async function updateCoach(id: string, input: { fullName?: string; contactPhone?: string; qualification?: string; policeVerificationRef?: string; verificationExpiry?: string; status?: "ACTIVE" | "INACTIVE" }): Promise<Coach> {
  const res = await apiFetch(`/coaches/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<Coach>>(res)).data;
}

// Real staff lookup -- needed to link a non-external coach to an existing
// person (coaches.service.ts requires a real personId for internal coaches).
// GET /staff broadened for SPORTS_ADMIN, read-only, after this exact gap
// surfaced during live end-to-end testing of the Coaches screen.
export interface StaffSummary {
  id: string;
  personId: string;
  firstName: string;
  lastName: string | null;
  designation: string | null;
}
export async function listStaff(search?: string): Promise<StaffSummary[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await apiFetch(`/staff${qs}`);
  return (await parseOrThrow<ApiEnvelope<StaffSummary[]>>(res)).data;
}

// ---------- Students (real, full school roster -- for adding to teams/trials/profiles) ----------

export interface StudentSummary {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  status: string;
}

export async function listStudents(filter: { search?: string; gradeId?: string; sectionId?: string } = {}): Promise<{ data: StudentSummary[]; meta: { total: number } }> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/students?${qs.toString()}`);
  return parseOrThrow(res);
}

export async function getStudent(id: string): Promise<StudentSummary | null> {
  const res = await apiFetch(`/students/${id}`);
  if (!res.ok) return null;
  return (await parseOrThrow<ApiEnvelope<StudentSummary>>(res)).data;
}

export interface Grade {
  id: string;
  name: string;
}
export async function listGrades(): Promise<Grade[]> {
  const res = await apiFetch("/grades");
  return (await parseOrThrow<ApiEnvelope<Grade[]>>(res)).data;
}

export interface Section {
  id: string;
  name: string;
  gradeId: string;
}
export async function listSections(gradeId?: string): Promise<Section[]> {
  const qs = gradeId ? `?gradeId=${gradeId}` : "";
  const res = await apiFetch(`/sections${qs}`);
  return (await parseOrThrow<ApiEnvelope<Section[]>>(res)).data;
}

// ---------- Academic year / school (for the topbar pills) ----------

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}
export async function listAcademicYears(): Promise<AcademicYear[]> {
  const res = await apiFetch("/academic-years");
  return (await parseOrThrow<ApiEnvelope<AcademicYear[]>>(res)).data;
}

// ---------- Academic calendar (for the Calendar screen) ----------

export type CalendarEventType = "HOLIDAY" | "TERM_START" | "TERM_END" | "EXAM_WINDOW" | "PTM" | "FUNCTION" | "COMPETITION" | "WORKING_SATURDAY" | "OTHER";
export interface CalendarEvent {
  id: string;
  academicYearId: string;
  title: string;
  description: string | null;
  eventType: CalendarEventType;
  isHoliday: boolean;
  startDate: string;
  endDate: string;
  createdBy: string | null;
}
export async function listCalendarEvents(params: { fromDate?: string; toDate?: string } = {}): Promise<CalendarEvent[]> {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]);
  const res = await apiFetch(`/calendar-events?${qs.toString()}`);
  return (await parseOrThrow<ApiEnvelope<CalendarEvent[]>>(res)).data;
}
export async function createCalendarEvent(input: { academicYearId: string; title: string; description?: string; startDate: string; endDate: string; eventType: CalendarEventType }): Promise<CalendarEvent> {
  const res = await apiFetch("/calendar-events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, scopeType: "SCHOOL" }) });
  return (await parseOrThrow<ApiEnvelope<CalendarEvent>>(res)).data;
}
// Both already real, already SPORTS_ADMIN-authorized -- but the backend
// only allows editing/deleting an event this same account created
// (assertCanModify in calendar-events.service.ts), so the UI only shows
// these for rows where createdBy matches the signed-in person.
export async function updateCalendarEvent(id: string, input: { title?: string; description?: string; startDate?: string; endDate?: string; eventType?: CalendarEventType }): Promise<CalendarEvent> {
  const res = await apiFetch(`/calendar-events/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<CalendarEvent>>(res)).data;
}
export async function deleteCalendarEvent(id: string): Promise<void> {
  const res = await apiFetch(`/calendar-events/${id}`, { method: "DELETE" });
  await parseOrThrow(res);
}

// ---------- Equipment catalog (Admin/Sports Admin-level CRUD, distinct from
// Faculty's own scoped issue/return calls re-exported above) ----------

export interface EquipmentItem {
  id: string;
  name: string;
  sportId: string | null;
  quantityTotal: number;
  quantityAvailable: number;
  condition: string | null;
  status: "ACTIVE" | "RETIRED";
}

export async function listEquipmentCatalog(includeRetired = false): Promise<EquipmentItem[]> {
  const res = await apiFetch(`/equipment${includeRetired ? "?includeRetired=true" : ""}`);
  return (await parseOrThrow<ApiEnvelope<EquipmentItem[]>>(res)).data;
}

export async function createEquipmentItem(input: { name: string; sportId?: string; quantityTotal: number; quantityAvailable?: number; condition?: string }): Promise<EquipmentItem> {
  const res = await apiFetch("/equipment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<EquipmentItem>>(res)).data;
}

// Edit already real (PATCH /equipment/:id); "Delete" is a genuine new soft-
// delete via status='RETIRED' -- see migration 0025_equipment_status.sql
// (this table had no status column, and no delete route, at all before).
export async function updateEquipmentItem(id: string, input: { name?: string; sportId?: string; quantityTotal?: number; quantityAvailable?: number; condition?: string; status?: "ACTIVE" | "RETIRED" }): Promise<EquipmentItem> {
  const res = await apiFetch(`/equipment/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<EquipmentItem>>(res)).data;
}

// ---------- Trials & selection (real -- see migration 0022_sports_trials.sql) ----------
// Constants/types live in sports-admin-trial-types.ts (zero runtime deps of
// its own) and are re-exported here so every existing import of them from
// this module keeps working unchanged -- see that file's own header comment
// for why the split exists.
export { TRIAL_ROUNDS, TRIAL_STATUSES, type TrialRound, type TrialStatus, type SportsTrial } from "./sports-admin-trial-types";
import type { TrialRound, TrialStatus, SportsTrial } from "./sports-admin-trial-types";

export async function listTrials(): Promise<SportsTrial[]> {
  const res = await apiFetch("/sports/trials");
  return (await parseOrThrow<ApiEnvelope<SportsTrial[]>>(res)).data;
}
export async function createTrial(input: { studentId: string; sportId: string; round: TrialRound; trialDate: string; score?: string; notes?: string }): Promise<SportsTrial> {
  const res = await apiFetch("/sports/trials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<SportsTrial>>(res)).data;
}
export async function updateTrial(id: string, input: { status?: TrialStatus; score?: string; notes?: string; round?: TrialRound; trialDate?: string }): Promise<SportsTrial> {
  const res = await apiFetch(`/sports/trials/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<SportsTrial>>(res)).data;
}
// No delete route existed before this build.
export async function deleteTrial(id: string): Promise<void> {
  const res = await apiFetch(`/sports/trials/${id}`, { method: "DELETE" });
  await parseOrThrow(res);
}

// ---------- Injuries & incidents (real -- see migration 0023_sports_injuries.sql) ----------

export const INJURY_STATUSES = ["UNDER_CARE", "OBSERVATION", "CLOSED"] as const;
export type InjuryStatus = (typeof INJURY_STATUSES)[number];

export interface SportsInjury {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  gradeName: string | null;
  sectionName: string | null;
  sportId: string | null;
  sportName: string | null;
  title: string;
  description: string | null;
  incidentDate: string;
  guardianInformed: boolean;
  guardianInformedAt: string | null;
  status: InjuryStatus;
  createdAt: string;
}

export async function listInjuries(): Promise<SportsInjury[]> {
  const res = await apiFetch("/sports/injuries");
  return (await parseOrThrow<ApiEnvelope<SportsInjury[]>>(res)).data;
}
export async function createInjury(input: { studentId: string; sportId?: string; title: string; description?: string; incidentDate: string; guardianInformed: boolean }): Promise<SportsInjury> {
  const res = await apiFetch("/sports/injuries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<SportsInjury>>(res)).data;
}
export async function updateInjury(id: string, input: { status?: InjuryStatus; guardianInformed?: boolean; title?: string; description?: string; incidentDate?: string }): Promise<SportsInjury> {
  const res = await apiFetch(`/sports/injuries/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<SportsInjury>>(res)).data;
}
// No delete route existed before this build.
export async function deleteInjury(id: string): Promise<void> {
  const res = await apiFetch(`/sports/injuries/${id}`, { method: "DELETE" });
  await parseOrThrow(res);
}

// ---------- Budget & approvals (real -- reuses purchase_request, see
// migration 0024_sports_budget_approval_policy.sql) ----------

export interface SportsBudgetRequest {
  id: string;
  referenceNo: string;
  itemName: string;
  description: string | null;
  estimatedAmountPaise: string | null;
  requestedBy: string | null;
  requestedByName: string | null;
  approvalRequestId: string | null;
  state: string;
  createdAt: string;
}

export async function listBudgetRequests(): Promise<SportsBudgetRequest[]> {
  const res = await apiFetch("/sports/budget-requests");
  return (await parseOrThrow<ApiEnvelope<SportsBudgetRequest[]>>(res)).data;
}
export async function createBudgetRequest(input: { title: string; description?: string; estimatedAmountPaise: string }): Promise<SportsBudgetRequest> {
  const res = await apiFetch("/sports/budget-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<SportsBudgetRequest>>(res)).data;
}

// ---------- PT / sports periods (real -- reuses the real academic
// timetable for the "Physical Training" subject, no new schema) ----------

export interface PtPeriodSlot {
  id: string;
  dayOfWeek: number;
  room: string | null;
  periodNo: number;
  periodLabel: string;
  startTime: string;
  endTime: string;
  sectionId: string;
  sectionName: string;
  gradeName: string;
  teacherFirstName: string;
  teacherLastName: string | null;
}

export async function listPtPeriods(): Promise<PtPeriodSlot[]> {
  const res = await apiFetch("/sports/pt-periods");
  return (await parseOrThrow<ApiEnvelope<PtPeriodSlot[]>>(res)).data;
}
