// Faculty "Ask permissions" -- CORRECTED to target the real, live,
// mobile-proven backend: student-events.controller.ts's /faculty/events
// (confirmed working by reading school-eos-mobile's own
// faculty-events-api.ts and permission-requests-api.ts, both of which call
// this exact same module in production). The earlier version of this file
// targeted permissions/activities.controller.ts, whose own repository files
// explicitly say their tables don't exist in the database yet -- that was
// the wrong backend, not a real gap; this file now matches what mobile
// actually calls.
//
// Model: an "event" (field trip, outing, etc.) has a real monitoring
// teacher (picked from a real staff search, never free-typed) and a set of
// student "participants," each independently PENDING / APPROVED / REJECTED
// -- the parent signs (APPROVED) or declines (REJECTED) on their own side
// (parent/permission-requests, a different real module). There is no bulk
// "add all students" endpoint -- adding "all" students means this file
// calls addParticipant once per student, same as any real client would.

import { apiFetch } from "./api";
import { parseApiResponse } from "./api-response";

export interface ApiEnvelope<T> {
  data: T;
}
async function parseOrThrow<T>(res: Response): Promise<T> {
  return parseApiResponse<T>(res);
}
async function get<T>(path: string): Promise<T> {
  return parseOrThrow<T>(await apiFetch(path));
}
async function post<T>(path: string, body?: unknown): Promise<T> {
  return parseOrThrow<T>(
    await apiFetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: body !== undefined ? JSON.stringify(body) : undefined }),
  );
}
async function del(path: string): Promise<void> {
  const res = await apiFetch(path, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
}

export interface StudentEvent {
  id: string;
  name: string;
  location: string;
  purpose: string;
  startsAt: string;
  endsAt: string;
  monitoringTeacherPersonId: string;
  monitoringTeacherName: string;
  monitoringTeacherDesignation: string | null;
  createdAt: string;
}
export type ParticipantState = "PENDING" | "APPROVED" | "REJECTED";
export interface EventParticipant {
  id: string;
  eventId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  rollNo: number | null;
  gradeName: string | null;
  sectionName: string | null;
  state: ParticipantState;
  decidedAt: string | null;
  addedAt: string;
}
export interface StudentEventDetail extends StudentEvent {
  participants: EventParticipant[];
}
export interface EventStudentSearchResult {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  gradeId: string | null;
  gradeName: string | null;
  sectionId: string | null;
  sectionName: string | null;
  rollNo: number | null;
}
export interface TeacherSearchResult {
  id: string;
  personId: string;
  firstName: string;
  lastName: string | null;
  designation: string | null;
}

export async function listEvents(): Promise<StudentEvent[]> {
  return (await get<ApiEnvelope<StudentEvent[]>>("/faculty/events")).data;
}
export async function getEventDetail(id: string): Promise<StudentEventDetail> {
  return (await get<ApiEnvelope<StudentEventDetail>>(`/faculty/events/${id}`)).data;
}
export async function createEvent(input: {
  name: string;
  location: string;
  purpose: string;
  monitoringTeacherPersonId: string;
  startsAt: string;
  endsAt: string;
}): Promise<StudentEvent> {
  return (await post<ApiEnvelope<StudentEvent>>("/faculty/events", input)).data;
}
export async function deleteEvent(id: string): Promise<void> {
  await del(`/faculty/events/${id}`);
}
export async function addParticipant(eventId: string, studentId: string): Promise<EventParticipant> {
  return (await post<ApiEnvelope<EventParticipant>>(`/faculty/events/${eventId}/students`, { studentId })).data;
}
export async function removeParticipant(eventId: string, participantId: string): Promise<void> {
  await del(`/faculty/events/${eventId}/students/${participantId}`);
}
export async function searchEventStudents(filter: { search?: string; gradeId?: string; sectionId?: string }): Promise<EventStudentSearchResult[]> {
  const qs = new URLSearchParams(Object.entries(filter).filter(([, v]) => !!v) as [string, string][]);
  return (await get<{ data: EventStudentSearchResult[] }>(`/faculty/events/students-search?${qs.toString()}`)).data;
}
export interface EventGrade {
  id: string;
  name: string;
}
export interface EventSection {
  id: string;
  gradeId: string;
  name: string;
}
export async function listEventGrades(): Promise<EventGrade[]> {
  return (await get<ApiEnvelope<EventGrade[]>>("/faculty/events/grades")).data;
}
export async function listEventSections(gradeId?: string): Promise<EventSection[]> {
  const qs = gradeId ? `?gradeId=${encodeURIComponent(gradeId)}` : "";
  return (await get<ApiEnvelope<EventSection[]>>(`/faculty/events/sections${qs}`)).data;
}
export async function searchEventTeachers(search: string): Promise<TeacherSearchResult[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return (await get<{ data: TeacherSearchResult[] }>(`/faculty/events/teachers-search${qs}`)).data;
}

export interface PermissionLetter {
  state: string;
  decidedAt: string | null;
  event: { name: string; location: string; purpose: string; startsAt: string; endsAt: string };
  monitoringTeacher: { name: string; designation: string | null };
  student: { name: string; admissionNo: string; rollNo: number | null; gradeName: string | null; sectionName: string | null };
  classTeacherName: string | null;
  parent: { name: string | null; addressLine1: string | null; addressLine2: string | null; city: string | null; state: string | null; pincode: string | null };
  school: {
    name: string; addressLine1: string | null; addressLine2: string | null; city: string | null; district: string | null;
    state: string | null; pincode: string | null; board: string | null; recognitionNo: string | null; contactPhone: string | null; contactEmail: string | null;
  } | null;
  signatureUrl: string | null;
}
export async function getPermissionLetter(eventId: string, participantId: string): Promise<PermissionLetter> {
  return (await get<ApiEnvelope<PermissionLetter>>(`/faculty/events/${eventId}/students/${participantId}/permission-letter`)).data;
}
