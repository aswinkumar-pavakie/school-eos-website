// Server-side-only Faculty API client — every call goes through apiFetch
// (Server Actions/Server Components only), matching this app's own
// convention (see finance-api.ts). Field names/shapes mirror the backend's
// real faculty/* controllers exactly (school-eos-backend/src/modules/faculty),
// the same module the Faculty mobile app already calls — this is a second
// consumer of that same, already-shipped backend, never a parallel rebuild.

import { apiFetch } from "./api";

export interface ApiEnvelope<T> {
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

/** "Who decided" trail — Student Leave, Staff Leave, HR Requests, Payslip
 * requests, Appraisal all attach this the same way (ApprovalStepRepository). */
export interface ApprovalStepSummary {
  sequenceNo: number;
  approverRoleCode: string;
  decision: "APPROVED" | "REJECTED" | null;
  decidedByName: string | null;
  decidedAt: string | null;
  comment: string | null;
}

export function roleLabel(roleCode: string): string {
  if (roleCode === "PRINCIPAL") return "Principal";
  if (roleCode === "FINANCE") return "Finance";
  if (roleCode === "ADMIN") return "Admin";
  return roleCode;
}

// ============================================================
// Scope — which classes this faculty member is scoped to
// ============================================================

export interface ScopedSection {
  sectionId: string;
  academicYearId: string;
  gradeName: string;
  sectionName: string;
}

export interface TeachingOffering {
  subjectOfferingId: string;
  sectionId: string;
  academicYearId: string;
  gradeName: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
}

export async function listAdvisorSections(): Promise<ScopedSection[]> {
  return (await get<ApiEnvelope<ScopedSection[]>>("/faculty/scope/advisor-sections")).data;
}
export async function listTeachingOfferings(): Promise<TeachingOffering[]> {
  return (await get<ApiEnvelope<TeachingOffering[]>>("/faculty/scope/teaching-offerings")).data;
}

// ============================================================
// Student Attendance
// ============================================================

export interface AttendanceSession {
  id: string;
  sectionId: string;
  sessionDate: string;
  sessionType: string;
  markedBy: string | null;
  markedAt: string | null;
  isLocked: boolean;
}
export interface AttendanceRecordRow {
  id: string;
  sessionId: string;
  studentId: string;
  status: string;
  reason: string | null;
  firstName: string;
  lastName: string | null;
  rollNo: number | null;
}
export interface AttendanceRoster {
  session: AttendanceSession;
  records: AttendanceRecordRow[];
}

export async function getAttendanceRoster(sectionId: string, date: string): Promise<AttendanceRoster> {
  return (await get<ApiEnvelope<AttendanceRoster>>(`/faculty/attendance?sectionId=${sectionId}&date=${date}`)).data;
}
export async function markAllPresent(sectionId: string, date: string): Promise<AttendanceRoster> {
  return (await post<ApiEnvelope<AttendanceRoster>>(`/faculty/attendance/mark-all-present?sectionId=${sectionId}&date=${date}`)).data;
}
export async function markAttendanceRecord(recordId: string, sectionId: string, input: { status: string; reason?: string }): Promise<unknown> {
  return (await post<ApiEnvelope<unknown>>(`/faculty/attendance/records/${recordId}?sectionId=${sectionId}`, input)).data;
}
export interface AttendanceHistoryDay {
  sessionId: string;
  date: string;
  total: number;
  present: number;
  absent: number;
  onLeave: number;
  absentees: { studentId: string; firstName: string; lastName: string | null; rollNo: number | null }[];
}
export async function getAttendanceHistory(sectionId: string, monthStart: string, monthEnd: string): Promise<AttendanceHistoryDay[]> {
  return (await get<ApiEnvelope<AttendanceHistoryDay[]>>(`/faculty/attendance/history?sectionId=${sectionId}&monthStart=${monthStart}&monthEnd=${monthEnd}`)).data;
}

// ============================================================
// Student Leave (advisor decides via the generic /approvals engine)
// ============================================================

// Note: unlike Staff Leave/HR Payroll/Payslip/Appraisal, this endpoint does
// NOT attach an approvalTrail (that would need a backend change, and the
// backend is finished/untouched for this build) -- only a plain decidedAt
// timestamp is available, no resolved decider name. The class advisor IS the
// decider here (a single-step decision, not a multi-role chain), so the
// state pill plus "decided on {date}" is the complete, honest picture.
export interface StudentLeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  rollNo: number | null;
  gradeName: string | null;
  sectionName: string | null;
  fromDate: string;
  toDate: string;
  reason: string;
  attachmentFileName: string | null;
  attachmentObjectKey: string | null;
  state: string;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
  approvalRequestId: string | null;
}

export async function listStudentLeaveRequests(): Promise<StudentLeaveRequest[]> {
  return (await get<ApiEnvelope<StudentLeaveRequest[]>>("/faculty/student-leave")).data;
}
export async function getStudentLeaveRequest(id: string): Promise<StudentLeaveRequest> {
  return (await get<ApiEnvelope<StudentLeaveRequest>>(`/faculty/student-leave/${id}`)).data;
}

// ============================================================
// Subject Records (read-only)
// ============================================================

export interface SubjectRecordExam {
  examName: string;
  marksObtained: number | null;
  maxMarks: number;
  isAbsent: boolean;
}
export interface SubjectRecordStudent {
  studentId: string;
  studentName: string;
  rollNo: string | null;
  totalObtained: number;
  totalMax: number;
  percent: number | null;
  grade: string | null;
  attendancePercent: number | null;
  guardianPhone: string | null;
  exams: SubjectRecordExam[];
}
export interface SubjectRecords {
  studentCount: number;
  classAvg: number | null;
  highest: number | null;
  students: SubjectRecordStudent[];
}
export async function getSubjectRecords(subjectOfferingId: string): Promise<SubjectRecords> {
  return (await get<ApiEnvelope<SubjectRecords>>(`/faculty/subject-records?subjectOfferingId=${subjectOfferingId}`)).data;
}

// ============================================================
// Marks Entry
// ============================================================

export interface MarksExam {
  examSubjectId: string;
  examId: string;
  examName: string;
  examType: string;
  term: string;
  examState: string;
  maxMarks: number;
  passMarks: number | null;
}
export async function listExamsForOffering(subjectOfferingId: string): Promise<MarksExam[]> {
  return (await get<ApiEnvelope<MarksExam[]>>(`/faculty/marks/offerings/${subjectOfferingId}/exams`)).data;
}
export interface MarksRosterRow {
  markId: string | null;
  studentId: string;
  studentName: string;
  rollNo: number | null;
  marksObtained: number | null;
  isAbsent: boolean;
  isExempted: boolean;
  state: string | null;
}
export async function getMarksRoster(examSubjectId: string): Promise<{ examSubject: MarksExam; roster: MarksRosterRow[] }> {
  return (await get<ApiEnvelope<{ examSubject: MarksExam; roster: MarksRosterRow[] }>>(`/faculty/marks/exam-subjects/${examSubjectId}/roster`)).data;
}
export async function saveMarks(examSubjectId: string, entries: { studentId: string; marksObtained?: number; isAbsent?: boolean }[]): Promise<{ saved: number }> {
  return (await post<ApiEnvelope<{ saved: number }>>(`/faculty/marks/exam-subjects/${examSubjectId}/save`, { entries })).data;
}
export async function publishMarks(examSubjectId: string): Promise<{ published: number }> {
  return (await post<ApiEnvelope<{ published: number }>>(`/faculty/marks/exam-subjects/${examSubjectId}/publish`)).data;
}

// ============================================================
// Announcements
// ============================================================

export interface AnnouncementAudience {
  audienceType: string;
  targetId: string | null;
  targetStage: string | null;
  targetRole: string | null;
}
export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string | null;
  priority: string;
  isEmergency: boolean;
  publishAt: string | null;
  expiresAt: string | null;
  createdBy: string;
  approvedBy: string | null;
  state: string;
  createdAt: string;
  audiences: AnnouncementAudience[];
  canEdit: boolean;
}
export async function listAnnouncements(): Promise<Announcement[]> {
  return (await get<ApiEnvelope<Announcement[]>>("/faculty/announcements")).data;
}
export async function listMyAnnouncements(): Promise<Announcement[]> {
  return (await get<ApiEnvelope<Announcement[]>>("/faculty/announcements/mine")).data;
}
export async function createAnnouncement(input: {
  title: string; body: string; category?: string; priority: string; isEmergency?: boolean; expiresAt?: string; targetSectionIds: string[];
}): Promise<Announcement> {
  return (await post<ApiEnvelope<Announcement>>("/faculty/announcements", input)).data;
}
export async function updateAnnouncement(id: string, input: Partial<{
  title: string; body: string; category: string; priority: string; isEmergency: boolean; expiresAt: string; targetSectionIds: string[];
}>): Promise<Announcement> {
  return (await patch<ApiEnvelope<Announcement>>(`/faculty/announcements/${id}`, input)).data;
}
export async function deleteAnnouncement(id: string): Promise<void> {
  await del(`/faculty/announcements/${id}`);
}

// ============================================================
// Class Results (advisor, read-only)
// ============================================================

export interface ClassResultExam {
  examId: string;
  examName: string;
  examType: string;
  term: string;
  examState: string;
}
export async function listClassResultExams(sectionId: string): Promise<ClassResultExam[]> {
  return (await get<ApiEnvelope<ClassResultExam[]>>(`/faculty/class-results/sections/${sectionId}/exams`)).data;
}
export interface ClassResultSubjectMark {
  subjectName: string;
  marksObtained: number | null;
  maxMarks: number;
  isAbsent: boolean;
}
export interface ClassResultStudent {
  studentId: string;
  studentName: string;
  rollNo: number | null;
  subjects: ClassResultSubjectMark[];
  totalObtained: number;
  totalMax: number;
  percent: number | null;
  grade: string | null;
  passed: boolean;
}
export interface ClassResults {
  classAvg: number | null;
  pass: { count: number; total: number };
  topper: number | null;
  gradeDistribution: { grade: string; label: string; count: number; percentOfClass: number; students: { studentName: string; percent: number | null }[] }[];
  toppers: ClassResultStudent[];
  students: ClassResultStudent[];
}
export async function getClassResults(sectionId: string, examId: string): Promise<ClassResults> {
  return (await get<ApiEnvelope<ClassResults>>(`/faculty/class-results/sections/${sectionId}/exams/${examId}`)).data;
}

// ============================================================
// Homework
// ============================================================

export interface HomeworkItem {
  id: string;
  subjectOfferingId: string;
  sectionId: string;
  gradeName: string;
  sectionName: string;
  subjectName: string;
  title: string;
  description: string | null;
  attachmentKeys: string[] | null;
  assignedOn: string;
  dueDate: string;
  maxMarks: number | null;
  status: string;
  total: number;
  finishedCount: number;
  gradedCount: number;
}
export interface HomeworkList {
  items: HomeworkItem[];
  classes: { subjectOfferingId: string; label: string }[];
  stats: { open: number; dueToday: number; ungraded: number };
}
export async function listHomework(): Promise<HomeworkList> {
  return (await get<ApiEnvelope<HomeworkList>>("/faculty/homework")).data;
}
export async function createHomework(input: { subjectOfferingId: string; title: string; description?: string; dueDate: string; maxMarks?: number }): Promise<HomeworkItem> {
  return (await post<ApiEnvelope<HomeworkItem>>("/faculty/homework", input)).data;
}
export async function updateHomework(id: string, input: Partial<{ title: string; description: string; dueDate: string; maxMarks: number; status: string }>): Promise<HomeworkItem> {
  return (await patch<ApiEnvelope<HomeworkItem>>(`/faculty/homework/${id}`, input)).data;
}
export async function deleteHomework(id: string): Promise<void> {
  await del(`/faculty/homework/${id}`);
}
export interface HomeworkRosterRow {
  studentId: string;
  studentName: string;
  rollNo: number | null;
  status: string;
  submittedAt: string | null;
  isLate: boolean;
  marksAwarded: number | null;
  feedback: string | null;
}
export async function getHomeworkRoster(id: string, tab: "DONE" | "NOT_DONE"): Promise<{ homework: HomeworkItem; roster: HomeworkRosterRow[] }> {
  return (await get<ApiEnvelope<{ homework: HomeworkItem; roster: HomeworkRosterRow[] }>>(`/faculty/homework/${id}/roster?tab=${tab}`)).data;
}

// ============================================================
// Class Teacher (advisor dashboard + student duties)
// ============================================================

export interface ClassTeacherDashboard {
  stats: { strength: number; presentToday: number; onLeaveToday: number };
  classDuties: {
    key: string;
    title: string;
    meta: string;
    status: string;
    pending?: { id: string; studentName: string; fromDate: string; toDate: string; reason: string }[];
  }[];
  officers: StudentDuty[];
}
export async function getClassTeacherDashboard(sectionId: string): Promise<ClassTeacherDashboard> {
  return (await get<ApiEnvelope<ClassTeacherDashboard>>(`/faculty/class-teacher/sections/${sectionId}/dashboard`)).data;
}
export interface StudentSearchResult {
  studentId: string;
  studentName: string;
  rollNo: number | null;
}
export async function searchSectionStudents(sectionId: string, q: string): Promise<StudentSearchResult[]> {
  return (await get<ApiEnvelope<StudentSearchResult[]>>(`/faculty/class-teacher/sections/${sectionId}/students/search?q=${encodeURIComponent(q)}`)).data;
}
export interface StudentDuty {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: number | null;
  title: string;
  duties: string | null;
  status: string;
  createdAt: string;
}
export async function listStudentDuties(sectionId: string): Promise<StudentDuty[]> {
  return (await get<ApiEnvelope<StudentDuty[]>>(`/faculty/class-teacher/sections/${sectionId}/duties`)).data;
}
export async function createStudentDuty(sectionId: string, input: { studentId: string; title: string; duties?: string }): Promise<StudentDuty> {
  return (await post<ApiEnvelope<StudentDuty>>(`/faculty/class-teacher/sections/${sectionId}/duties`, input)).data;
}
export async function updateStudentDuty(id: string, input: Partial<{ title: string; duties: string; status: string }>): Promise<StudentDuty> {
  return (await patch<ApiEnvelope<StudentDuty>>(`/faculty/class-teacher/duties/${id}`, input)).data;
}
export async function removeStudentDuty(id: string): Promise<void> {
  await del(`/faculty/class-teacher/duties/${id}`);
}

// ============================================================
// Generic approval decision — Student Leave uses this directly
// ============================================================

export async function approveRequest(approvalRequestId: string, comment?: string): Promise<void> {
  await post(`/approvals/${approvalRequestId}/approve`, comment ? { comment } : undefined);
}
// The design system is absolute here (component #23): reject always demands a
// reason, unlike approve — comment is required, not optional, matching the
// backend's own RejectApprovalDto.
export async function rejectRequest(approvalRequestId: string, comment: string): Promise<void> {
  await post(`/approvals/${approvalRequestId}/reject`, { comment });
}
