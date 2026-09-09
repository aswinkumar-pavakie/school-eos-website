// Academic Coordinator -- real backend calls only
// (faculty/academic-coordinator controller). Every write is re-validated
// server-side against the caller's real, live role_assignment scope
// regardless of what this client sends. Same server-only apiFetch
// convention as faculty-api.ts.

import { apiFetch } from "./api";

interface ApiEnvelope<T> {
  data: T;
}
async function parseOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message ?? `Request failed (${res.status})`);
  }
  return body as T;
}
async function get<T>(path: string): Promise<T> {
  return parseOrThrow<T>(await apiFetch(path));
}
async function post<T>(path: string, body?: unknown): Promise<T> {
  return parseOrThrow<T>(
    await apiFetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: body !== undefined ? JSON.stringify(body) : undefined }),
  );
}
async function patch<T>(path: string, body?: unknown): Promise<T> {
  return parseOrThrow<T>(
    await apiFetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: body !== undefined ? JSON.stringify(body) : undefined }),
  );
}
async function del(path: string): Promise<void> {
  const res = await apiFetch(path, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
}

export interface CoordinatorGrade {
  gradeId: string;
  gradeName: string;
  levelNo: number;
  stage: string;
  sectionCount: number;
  studentCount: number;
}
export interface CoordinatorMe {
  isCoordinator: boolean;
  stages: string[];
  grades: CoordinatorGrade[];
}
export async function getCoordinatorMe(): Promise<CoordinatorMe> {
  return (await get<ApiEnvelope<CoordinatorMe>>("/faculty/academic-coordinator/me")).data;
}

export interface CoordinatorDashboard {
  stages: string[];
  gradeCount: number;
  sectionCount: number;
  studentCount: number;
  subjectOfferingCount: number;
  facultyCount: number;
  unassignedOfferings: number;
  sectionsWithoutAdvisor: number;
}
export async function getCoordinatorDashboard(): Promise<CoordinatorDashboard> {
  return (await get<ApiEnvelope<CoordinatorDashboard>>("/faculty/academic-coordinator/dashboard")).data;
}

export interface CoordinatorSection {
  sectionId: string;
  sectionName: string;
  gradeId: string;
  gradeName: string;
  studentCount: number;
  advisorRoleAssignmentId: string | null;
  advisorPersonId: string | null;
  advisorName: string | null;
}
export async function getCoordinatorStructure(): Promise<{ grades: CoordinatorGrade[]; sections: CoordinatorSection[] }> {
  return (await get<ApiEnvelope<{ grades: CoordinatorGrade[]; sections: CoordinatorSection[] }>>("/faculty/academic-coordinator/structure")).data;
}
export async function getCoordinatorSections(gradeId?: string): Promise<CoordinatorSection[]> {
  return (await get<ApiEnvelope<CoordinatorSection[]>>(`/faculty/academic-coordinator/sections${gradeId ? `?gradeId=${gradeId}` : ""}`)).data;
}

export interface CoordinatorOffering {
  subjectOfferingId: string;
  sectionId: string;
  gradeName: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  weeklyPeriods: number | null;
  teacherStaffId: string | null;
  teacherPersonId: string | null;
  teacherName: string | null;
}
export async function getCoordinatorOfferings(filter: { gradeId?: string; sectionId?: string } = {}): Promise<CoordinatorOffering[]> {
  const qs = new URLSearchParams();
  if (filter.gradeId) qs.set("gradeId", filter.gradeId);
  if (filter.sectionId) qs.set("sectionId", filter.sectionId);
  const suffix = qs.toString() ? `?${qs}` : "";
  return (await get<ApiEnvelope<CoordinatorOffering[]>>(`/faculty/academic-coordinator/offerings${suffix}`)).data;
}
export async function assignOfferingTeacher(offeringId: string, teacherStaffId: string | null): Promise<CoordinatorOffering> {
  return (await patch<ApiEnvelope<CoordinatorOffering>>(`/faculty/academic-coordinator/offerings/${offeringId}/teacher`, { teacherStaffId })).data;
}

export interface EligibleFaculty {
  staffId: string;
  personId: string;
  name: string;
  designation: string | null;
}
export async function getEligibleFaculty(): Promise<EligibleFaculty[]> {
  return (await get<ApiEnvelope<EligibleFaculty[]>>("/faculty/academic-coordinator/eligible-faculty")).data;
}

export interface FacultyWorkload {
  staffId: string;
  personId: string;
  name: string;
  offeringCount: number;
  weeklyPeriods: number;
}
export async function getFacultyWorkload(): Promise<FacultyWorkload[]> {
  return (await get<ApiEnvelope<FacultyWorkload[]>>("/faculty/academic-coordinator/faculty-workload")).data;
}

export async function assignClassAdvisor(sectionId: string, personId: string): Promise<void> {
  await post(`/faculty/academic-coordinator/sections/${sectionId}/advisor`, { personId });
}
export async function revokeClassAdvisor(sectionId: string): Promise<void> {
  await del(`/faculty/academic-coordinator/sections/${sectionId}/advisor`);
}

export interface CoordinatorTimetablePeriod {
  periodId: string;
  periodNo: number;
  label: string | null;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}
export interface CoordinatorTimetableSlot {
  slotId: string;
  periodId: string;
  periodNo: number;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  room: string | null;
  isDraft: boolean;
  subjectOfferingId: string;
  subjectName: string;
  teacherName: string | null;
}
export async function getCoordinatorTimetable(
  sectionId: string,
): Promise<{ section: CoordinatorSection; periods: CoordinatorTimetablePeriod[]; slots: CoordinatorTimetableSlot[] }> {
  return (
    await get<ApiEnvelope<{ section: CoordinatorSection; periods: CoordinatorTimetablePeriod[]; slots: CoordinatorTimetableSlot[] }>>(
      `/faculty/academic-coordinator/timetable/${sectionId}`,
    )
  ).data;
}
export async function upsertTimetableSlot(input: { sectionId: string; dayOfWeek: number; periodId: string; subjectOfferingId: string; room?: string }): Promise<{ slotId: string }> {
  return (await post<ApiEnvelope<{ slotId: string }>>("/faculty/academic-coordinator/timetable/slots", input)).data;
}
export async function deleteTimetableSlot(slotId: string): Promise<void> {
  await del(`/faculty/academic-coordinator/timetable/slots/${slotId}`);
}
export async function publishTimetable(sectionId: string): Promise<{ publishedSlotCount: number }> {
  return (await post<ApiEnvelope<{ publishedSlotCount: number }>>(`/faculty/academic-coordinator/timetable/${sectionId}/publish`)).data;
}

export interface CoordinatorExam {
  examId: string;
  name: string;
  examType: string;
  term: string | null;
  state: string;
  gradeNames: string[];
}
export async function listCoordinatorExams(): Promise<CoordinatorExam[]> {
  return (await get<ApiEnvelope<CoordinatorExam[]>>("/faculty/academic-coordinator/exams")).data;
}
export async function createCoordinatorExam(input: { name: string; examType: string; term?: string; gradeIds: string[] }): Promise<{ examId: string }> {
  return (await post<ApiEnvelope<{ examId: string }>>("/faculty/academic-coordinator/exams", input)).data;
}
export async function advanceExamState(examId: string): Promise<{ state: string }> {
  return (await post<ApiEnvelope<{ state: string }>>(`/faculty/academic-coordinator/exams/${examId}/advance`)).data;
}

export interface CoordinatorExamSubject {
  examSubjectId: string;
  examId: string;
  subjectOfferingId: string;
  subjectName: string;
  gradeName: string;
  sectionName: string;
  examDate: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  room: string | null;
  maxMarks: string;
  passMarks: string | null;
  hasPractical: boolean;
  practicalMax: string | null;
  internalMax: string | null;
}
export async function listExamSubjects(examId: string): Promise<CoordinatorExamSubject[]> {
  return (await get<ApiEnvelope<CoordinatorExamSubject[]>>(`/faculty/academic-coordinator/exams/${examId}/subjects`)).data;
}
export async function createExamSubject(
  examId: string,
  input: { subjectOfferingId: string; examDate?: string; startTime?: string; durationMinutes?: number; room?: string; maxMarks: number; passMarks?: number },
): Promise<{ examSubjectId: string }> {
  return (await post<ApiEnvelope<{ examSubjectId: string }>>(`/faculty/academic-coordinator/exams/${examId}/subjects`, input)).data;
}
export async function updateExamSubject(
  examSubjectId: string,
  input: Partial<{ examDate: string; startTime: string; durationMinutes: number; room: string; maxMarks: number; passMarks: number }>,
): Promise<void> {
  await patch(`/faculty/academic-coordinator/exam-subjects/${examSubjectId}`, input);
}

export interface ExamReadinessRow extends CoordinatorExamSubject {
  expectedCount: number;
  enteredCount: number;
  verifiedCount: number;
}
export async function getExamReadiness(examId: string): Promise<ExamReadinessRow[]> {
  return (await get<ApiEnvelope<ExamReadinessRow[]>>(`/faculty/academic-coordinator/exams/${examId}/readiness`)).data;
}

export interface CoordinatorCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  isHoliday: boolean;
  startDate: string;
  endDate: string;
  scopeType: string;
  scopeStage: string | null;
}
export async function listCoordinatorCalendarEvents(): Promise<CoordinatorCalendarEvent[]> {
  return (await get<ApiEnvelope<CoordinatorCalendarEvent[]>>("/faculty/academic-coordinator/calendar")).data;
}
export async function createCoordinatorCalendarEvent(input: {
  scopeStage: string; title: string; description?: string; eventType: string; isHoliday?: boolean; startDate: string; endDate: string;
}): Promise<{ id: string }> {
  return (await post<ApiEnvelope<{ id: string }>>("/faculty/academic-coordinator/calendar", input)).data;
}
export async function updateCoordinatorCalendarEvent(
  id: string,
  input: Partial<{ title: string; description: string; eventType: string; isHoliday: boolean; startDate: string; endDate: string }>,
): Promise<void> {
  await patch(`/faculty/academic-coordinator/calendar/${id}`, input);
}
export async function deleteCoordinatorCalendarEvent(id: string): Promise<void> {
  await del(`/faculty/academic-coordinator/calendar/${id}`);
}
