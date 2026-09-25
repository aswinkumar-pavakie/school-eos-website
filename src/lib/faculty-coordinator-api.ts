// Academic Coordinator -- real backend calls only
// (faculty/academic-coordinator controller). Every write is re-validated
// server-side against the caller's real, live role_assignment scope
// regardless of what this client sends. Same server-only apiFetch
// convention as faculty-api.ts.

import { apiFetch } from "./api";
import { parseApiResponse } from "./api-response";

interface ApiEnvelope<T> {
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
  marksEntryOpensAt: string | null;
  marksEntryClosesAt: string | null;
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

// ---------- Marks entry window ----------
// Real exam.marks_entry_opens_at/closes_at columns -- a real, enforced gate:
// faculty-marks.service.ts's own save() rejects new entries once `now` falls
// outside this window, so setting it here takes effect immediately for
// every subject teacher entering marks against this exam.
export async function setMarksEntryWindow(
  examId: string,
  input: { opensAt?: string; closesAt?: string },
): Promise<{ opensAt: string | null; closesAt: string | null }> {
  return (
    await patch<ApiEnvelope<{ opensAt: string | null; closesAt: string | null }>>(
      `/faculty/academic-coordinator/exams/${examId}/marks-window`,
      input,
    )
  ).data;
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

// ---------- Notices ----------
// Real AnnouncementsService, same one Admin/Principal/Faculty already use --
// server-enforced to a coordinator's own scoped sections (SECTION audience)
// or every Academic Coordinator (ROLE audience) -- see
// faculty-academic-coordinator.service.ts's own createNotice.

export interface CoordinatorNoticeAudience {
  audienceType: "SCHOOL" | "ROLE" | "SECTION";
  targetId: string | null;
}
export interface CoordinatorNotice {
  id: string;
  title: string;
  body: string;
  category: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  isEmergency: boolean;
  publishAt: string | null;
  expiresAt: string | null;
  createdBy: string;
  state: string;
  createdAt: string;
  audiences: CoordinatorNoticeAudience[];
  canEdit: boolean;
}
export async function listCoordinatorNotices(): Promise<CoordinatorNotice[]> {
  return (await get<ApiEnvelope<CoordinatorNotice[]>>("/faculty/academic-coordinator/notices")).data;
}
export async function createCoordinatorNotice(input: {
  title: string;
  body: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  audienceType: "ROLE" | "SECTION";
  targetRoles?: string[];
  targetSectionIds?: string[];
}): Promise<CoordinatorNotice> {
  return (await post<ApiEnvelope<CoordinatorNotice>>("/faculty/academic-coordinator/notices", input)).data;
}
export async function updateCoordinatorNotice(
  id: string,
  input: Partial<{ title: string; body: string; priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" }>,
): Promise<CoordinatorNotice> {
  return (await patch<ApiEnvelope<CoordinatorNotice>>(`/faculty/academic-coordinator/notices/${id}`, input)).data;
}
export async function deleteCoordinatorNotice(id: string): Promise<void> {
  await del(`/faculty/academic-coordinator/notices/${id}`);
}

// ---------- Performance ----------
// Real per-section exam results (class average, pass rate, grade
// distribution, toppers, per-student rank) -- same computation a class
// advisor's own Performance screen already uses (FacultyClassResultsService),
// server-side scoped to the coordinator's own real sections. See
// faculty-academic-coordinator.service.ts's own getPerformance.

export interface PerformanceExamOption {
  examId: string;
  examName: string;
}
export interface PerformanceSubjectMark {
  subjectName: string;
  marksObtained: number | null;
  maxMarks: number;
  isAbsent: boolean;
}
export interface PerformanceStudentRow {
  studentId: string;
  studentName: string;
  rollNo: number | null;
  subjects: PerformanceSubjectMark[];
  totalObtained: number;
  totalMax: number;
  percent: number | null;
  grade: string | null;
  passed: boolean;
}
export interface PerformanceGradeBand {
  grade: string;
  label: string;
  count: number;
  percentOfClass: number;
  students: { studentName: string; percent: number | null }[];
}
export interface PerformanceResults {
  classAvg: number | null;
  pass: { count: number; total: number };
  topper: number | null;
  gradeDistribution: PerformanceGradeBand[];
  toppers: (PerformanceStudentRow & { totalObtained: number; totalMax: number })[];
  students: PerformanceStudentRow[];
}
export async function listPerformanceExams(sectionId: string): Promise<PerformanceExamOption[]> {
  return (await get<ApiEnvelope<PerformanceExamOption[]>>(`/faculty/academic-coordinator/performance/sections/${sectionId}/exams`)).data;
}
export async function getPerformance(sectionId: string, examId: string): Promise<PerformanceResults> {
  return (await get<ApiEnvelope<PerformanceResults>>(`/faculty/academic-coordinator/performance/sections/${sectionId}/exams/${examId}`)).data;
}

// ---------- Attendance ----------
// Real per-section attendance for one date, server-side scoped to the
// coordinator's own real sections -- see faculty-academic-coordinator.
// service.ts's own listAttendance. No cross-section rollup exists anywhere
// else in this schema, so this composes real per-section session+record
// data itself rather than a fabricated summary number.

export interface CoordinatorSectionAttendance {
  sectionId: string;
  gradeName: string;
  sectionName: string;
  studentCount: number;
  sessionFound: boolean;
  isLocked: boolean;
  presentCount: number;
  absentCount: number;
  otherCount: number;
}
export async function listCoordinatorAttendance(date?: string): Promise<CoordinatorSectionAttendance[]> {
  return (await get<ApiEnvelope<CoordinatorSectionAttendance[]>>(`/faculty/academic-coordinator/attendance${date ? `?date=${date}` : ""}`)).data;
}

// A coordinator's real per-student roster for one section+date, and the
// real correction path -- ONLY usable once the class advisor has published
// (locked) that day's session, exactly matching how the advisor's own
// post-publish edit already works (AttendanceRecordsService.correct). See
// faculty-academic-coordinator.service.ts's own getAttendanceRoster/
// correctAttendanceRecord.
export interface CoordinatorAttendanceSession {
  id: string;
  sectionId: string;
  sessionDate: string;
  isLocked: boolean;
}
export interface CoordinatorAttendanceRecord {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string | null;
  rollNo: number | null;
  status: string;
  reason: string | null;
}
export async function getCoordinatorAttendanceRoster(
  sectionId: string,
  date: string,
): Promise<{ session: CoordinatorAttendanceSession | null; records: CoordinatorAttendanceRecord[] }> {
  return (
    await get<ApiEnvelope<{ session: CoordinatorAttendanceSession | null; records: CoordinatorAttendanceRecord[] }>>(
      `/faculty/academic-coordinator/attendance/sections/${sectionId}/roster?date=${date}`,
    )
  ).data;
}
/** Full parity with the class advisor's own mark -- while the session is
 * still open this is a direct edit; once published (by the advisor or the
 * coordinator themselves), this transparently becomes a correction instead
 * (the backend's own markAttendanceRecord decides which, based on the
 * session's real isLocked state -- never trusted from this client). */
export async function markCoordinatorAttendanceRecord(
  sectionId: string,
  recordId: string,
  input: { status: string; reason?: string },
): Promise<void> {
  await patch(`/faculty/academic-coordinator/attendance/sections/${sectionId}/records/${recordId}`, input);
}
export async function markAllPresentCoordinatorAttendance(
  sectionId: string,
  date: string,
): Promise<{ session: CoordinatorAttendanceSession; records: CoordinatorAttendanceRecord[] }> {
  return (
    await post<ApiEnvelope<{ session: CoordinatorAttendanceSession; records: CoordinatorAttendanceRecord[] }>>(
      `/faculty/academic-coordinator/attendance/sections/${sectionId}/mark-all-present?date=${date}`,
    )
  ).data;
}
export async function publishCoordinatorAttendance(
  sectionId: string,
  date: string,
): Promise<{ session: CoordinatorAttendanceSession; records: CoordinatorAttendanceRecord[] }> {
  return (
    await post<ApiEnvelope<{ session: CoordinatorAttendanceSession; records: CoordinatorAttendanceRecord[] }>>(
      `/faculty/academic-coordinator/attendance/sections/${sectionId}/publish?date=${date}`,
    )
  ).data;
}

// ---------- Students ----------
// Real StudentRepository, server-side scoped to the coordinator's own real
// grades (never trusted from this client) -- see
// faculty-academic-coordinator.service.ts's own listStudents.

export interface CoordinatorStudentRow {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  status: string;
  gradeId: string | null;
  gradeName: string | null;
  sectionId?: string | null;
  sectionName?: string | null;
}
// Real, full-profile read on one student -- see
// faculty-academic-coordinator.service.ts's own getStudentDetail, which
// composes the exact same real services (StudentsService,
// GuardianLinksService, AttendanceRecordsService, StudentFeesService)
// faculty-student-detail.service.ts already uses for the Faculty console's
// own student profile page, just gated by the coordinator's real grade
// scope instead of "class advisor of this section".
export interface CoordinatorStudentProfile {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  admissionDate: string;
  bloodGroup: string | null;
  isHosteller: boolean;
  usesSchoolTransport: boolean;
  status: string;
  gradeName: string | null;
  sectionName: string | null;
  rollNo: number | null;
  photoUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}
export interface CoordinatorStudentGuardian {
  id: string;
  firstName: string;
  lastName: string | null;
  relationship: string;
  isPrimaryContact: boolean;
  occupation: string | null;
}
export interface CoordinatorStudentAttendance {
  presentCount: number;
  totalCount: number;
  percentage: number | null;
}
export interface CoordinatorStudentFees {
  overallStatus: string;
  totalDuePaise: string;
  totalPaidPaise: string;
  totalPendingPaise: string;
  totalOverduePaise: string;
}
export interface CoordinatorStudentDetail {
  student: CoordinatorStudentProfile;
  guardians: CoordinatorStudentGuardian[];
  attendance: CoordinatorStudentAttendance;
  fees: CoordinatorStudentFees;
}
export async function getCoordinatorStudentDetail(studentId: string): Promise<CoordinatorStudentDetail> {
  return (await get<ApiEnvelope<CoordinatorStudentDetail>>(`/faculty/academic-coordinator/students/${studentId}`)).data;
}

export async function listCoordinatorStudents(
  filter: { search?: string; sectionId?: string; page?: number; limit?: number } = {},
): Promise<{ data: CoordinatorStudentRow[]; meta: { page: number; limit: number; total: number } }> {
  const qs = new URLSearchParams();
  if (filter.search) qs.set("search", filter.search);
  if (filter.sectionId) qs.set("sectionId", filter.sectionId);
  if (filter.page) qs.set("page", String(filter.page));
  if (filter.limit) qs.set("limit", String(filter.limit));
  const suffix = qs.toString() ? `?${qs}` : "";
  return get(`/faculty/academic-coordinator/students${suffix}`);
}

// ---------- Substitute teacher (free-period finder) ----------
// Real published timetable_slot data, reused read-only from the Admin/
// Principal timetable module (now also granted to ACADEMIC_COORDINATOR --
// see timetable.controller.ts's own broadened @Roles()).

// Real occupied slots only -- a free period simply has no row here (the
// `timetable_slot` table only stores filled periods), never a placeholder.
// Compute "free this period" as: every non-break period from listPeriods()
// minus whatever appears here for a given day.
export interface TeacherTimetableSlot {
  id: string;
  dayOfWeek: number;
  room: string | null;
  periodId: string;
  periodNo: number;
  periodLabel: string;
  startTime: string;
  endTime: string;
  sectionId: string;
  sectionName: string;
  gradeName: string;
  subjectId: string;
  subjectName: string;
  teacherStaffId: string;
  teacherFirstName: string;
  teacherLastName: string | null;
}
export async function getTeacherTimetable(teacherStaffId: string): Promise<TeacherTimetableSlot[]> {
  return (await get<ApiEnvelope<TeacherTimetableSlot[]>>(`/timetable?teacherStaffId=${teacherStaffId}`)).data;
}

export interface TimetablePeriod {
  id: string;
  periodNo: number;
  label: string | null;
  startTime: string;
  endTime: string;
  appliesToStage: string | null;
  isBreak: boolean;
}
export async function listAllTimetablePeriods(): Promise<TimetablePeriod[]> {
  return (await get<ApiEnvelope<TimetablePeriod[]>>("/timetable/periods")).data;
}
export async function getSectionTimetableSlots(sectionId: string): Promise<TeacherTimetableSlot[]> {
  return (await get<ApiEnvelope<TeacherTimetableSlot[]>>(`/timetable?sectionId=${sectionId}`)).data;
}

// ---------- Syllabus tracking ----------
// Real syllabus_unit/syllabus_progress tables -- see
// academic-coordinator-syllabus.repository.ts's own header note. Read-only;
// actually marking a unit done stays the subject teacher's own job.

export interface SyllabusCoverageRow {
  subjectOfferingId: string;
  gradeName: string;
  sectionName: string;
  subjectName: string;
  teacherName: string | null;
  doneUnits: number;
  totalUnits: number;
  percent: number;
  behindUnits: number;
}
export async function listSyllabusCoverage(): Promise<SyllabusCoverageRow[]> {
  return (await get<ApiEnvelope<SyllabusCoverageRow[]>>("/faculty/academic-coordinator/syllabus")).data;
}

// ---------- Academic approvals ----------
// A real, actionable worklist -- subject offerings with no teacher, sections
// with no class advisor -- both resolved via the same real
// assignOfferingTeacher/assignClassAdvisor actions already used elsewhere in
// this module. See faculty-academic-coordinator.service.ts's own
// listAcademicApprovals for why the generic approval_request engine isn't
// used here (nothing routes to ACADEMIC_COORDINATOR in it today).

export interface UnassignedOfferingItem {
  type: "UNASSIGNED_OFFERING";
  subjectOfferingId: string;
  title: string;
  detail: string;
}
export interface MissingAdvisorItem {
  type: "MISSING_ADVISOR";
  sectionId: string;
  title: string;
  detail: string;
}
export async function listAcademicApprovals(): Promise<{
  unassignedOfferings: UnassignedOfferingItem[];
  sectionsWithoutAdvisor: MissingAdvisorItem[];
}> {
  return (
    await get<
      ApiEnvelope<{ unassignedOfferings: UnassignedOfferingItem[]; sectionsWithoutAdvisor: MissingAdvisorItem[] }>
    >("/faculty/academic-coordinator/approvals")
  ).data;
}

// ---------- Reports ----------
// A real, composed grade-wise summary over data this module already
// computes elsewhere (Attendance, Performance, Syllabus tracking) -- see
// faculty-academic-coordinator.service.ts's own getReports for why each
// section uses its own latest applicable exam rather than one shared one.

export interface ReportsClassResultRow {
  sectionId: string;
  gradeName: string;
  sectionName: string;
  advisorName: string | null;
  examName: string;
  strength: number;
  appeared: number;
  passPercent: number | null;
  average: number | null;
  below35: number;
}
export interface ReportsSubjectPerformanceRow {
  subjectName: string;
  average: number;
}
export interface CoordinatorReports {
  stages: string[];
  gradeCount: number;
  studentCount: number;
  kpis: {
    avgExamPercent: number | null;
    avgSyllabusPercent: number | null;
    avgAttendancePercent: number | null;
    openApprovals: number;
  };
  classResults: ReportsClassResultRow[];
  subjectPerformance: ReportsSubjectPerformanceRow[];
  attendance: CoordinatorSectionAttendance[];
  syllabus: SyllabusCoverageRow[];
}
export async function getCoordinatorReports(): Promise<CoordinatorReports> {
  return (await get<ApiEnvelope<CoordinatorReports>>("/faculty/academic-coordinator/reports")).data;
}

// ---------- Marks verification ----------
// A real coordinator review decision over each section's real, already-
// PUBLISHED exam results (the same data Performance shows) -- Verified, or
// Sent back with a comment. See faculty-academic-coordinator.service.ts's
// own listMarksSubmissions/verifyMarksSubmission/sendBackMarksSubmission.
// Never alters the underlying mark rows or a teacher's own publish step.

export type MarksSubmissionStatus = "PENDING" | "VERIFIED" | "SENT_BACK";
export interface MarksSubmission {
  sectionId: string;
  gradeName: string;
  sectionName: string;
  examId: string;
  examName: string;
  examType: string;
  term: string | null;
  status: MarksSubmissionStatus;
  comment: string | null;
  decidedAt: string | null;
}
export async function listMarksSubmissions(): Promise<MarksSubmission[]> {
  return (await get<ApiEnvelope<MarksSubmission[]>>("/faculty/academic-coordinator/marks-submissions")).data;
}
export interface MarksSubmissionDetail extends PerformanceResults {
  status: MarksSubmissionStatus;
  comment: string | null;
  decidedAt: string | null;
}
export async function getMarksSubmissionDetail(sectionId: string, examId: string): Promise<MarksSubmissionDetail> {
  return (
    await get<ApiEnvelope<MarksSubmissionDetail>>(
      `/faculty/academic-coordinator/marks-submissions/sections/${sectionId}/exams/${examId}`,
    )
  ).data;
}
export async function verifyMarksSubmission(sectionId: string, examId: string): Promise<{ status: MarksSubmissionStatus }> {
  return (
    await post<ApiEnvelope<{ status: MarksSubmissionStatus }>>(
      `/faculty/academic-coordinator/marks-submissions/sections/${sectionId}/exams/${examId}/verify`,
    )
  ).data;
}
export async function sendBackMarksSubmission(sectionId: string, examId: string, comment: string): Promise<{ status: MarksSubmissionStatus }> {
  return (
    await post<ApiEnvelope<{ status: MarksSubmissionStatus }>>(
      `/faculty/academic-coordinator/marks-submissions/sections/${sectionId}/exams/${examId}/send-back`,
      { comment },
    )
  ).data;
}

// ---------- Substitute teacher ----------
// Real "who's absent today" (an APPROVED staff_leave_request covering the
// date -- see faculty-academic-coordinator.service.ts's own
// listSubstituteGaps for why this is the one real absence signal this
// schema has), real gaps (that teacher's own published timetable_slot
// rows), real ranked-by-load free candidates, and real persisted
// assignments in the `substitution` table (previously unused anywhere in
// this backend).

export interface SubstituteCandidate {
  staffId: string;
  name: string;
  weeklyPeriods: number;
}
export interface SubstituteGap {
  timetableSlotId: string;
  periodId: string;
  periodNo: number;
  startTime: string;
  sectionId: string;
  gradeName: string;
  sectionName: string;
  subjectName: string;
  absentStaffId: string;
  absentTeacherName: string;
  assignedSubstituteStaffId: string | null;
  candidates: SubstituteCandidate[];
}
export async function listSubstituteGaps(date: string): Promise<{ gaps: SubstituteGap[]; absentTeachers: { staffId: string; name: string }[] }> {
  return (
    await get<ApiEnvelope<{ gaps: SubstituteGap[]; absentTeachers: { staffId: string; name: string }[] }>>(
      `/faculty/academic-coordinator/substitute-gaps?date=${date}`,
    )
  ).data;
}
export async function assignSubstitution(input: {
  timetableSlotId: string;
  originalStaffId: string;
  substituteStaffId: string;
  subDate: string;
  reason?: string;
}): Promise<{ id: string }> {
  return (await post<ApiEnvelope<{ id: string }>>("/faculty/academic-coordinator/substitutions", input)).data;
}
