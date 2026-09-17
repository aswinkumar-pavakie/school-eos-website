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

// ---------- Equipment catalog (Admin/Sports Admin-level CRUD, distinct from
// Faculty's own scoped issue/return calls re-exported above) ----------

export interface EquipmentItem {
  id: string;
  name: string;
  sportId: string | null;
  quantityTotal: number;
  quantityAvailable: number;
  condition: string | null;
}

export async function listEquipmentCatalog(): Promise<EquipmentItem[]> {
  const res = await apiFetch("/equipment");
  return (await parseOrThrow<ApiEnvelope<EquipmentItem[]>>(res)).data;
}

export async function createEquipmentItem(input: { name: string; sportId?: string; quantityTotal: number; quantityAvailable?: number; condition?: string }): Promise<EquipmentItem> {
  const res = await apiFetch("/equipment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<EquipmentItem>>(res)).data;
}
