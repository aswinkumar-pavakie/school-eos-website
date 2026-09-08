// Server-side-only Parent API client -- every call goes through apiFetch
// (Server Actions/Server Components only), matching this app's own
// convention (see faculty-api.ts). Field names/shapes mirror the backend's
// real parent/* controllers exactly (school-eos-backend/src/modules/parent),
// the same module the Parent mobile app already calls (school-eos-mobile's
// own src/lib/parent-api.ts) -- this is a second consumer of that same,
// already-shipped backend, never a parallel rebuild.

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
async function postForm<T>(path: string, form: FormData): Promise<T> {
  return parseOrThrow<T>(await apiFetch(path, { method: "POST", body: form }));
}

// ============================================================
// Children (guardian_link) -- every page needs `?studentId=` resolved
// against this list; see src/app/(dashboard)/parent/child-selector.ts.
// ============================================================

export interface ParentChild {
  studentId: string;
  studentName: string;
  gradeName: string | null;
  sectionName: string | null;
  mediumName: string | null;
  rollNo: string | null;
  relationship: string;
  isPrimaryContact: boolean;
  accessLevel: "FULL" | "VIEW_ONLY" | "NO_FINANCE";
}

export async function listChildren(): Promise<ParentChild[]> {
  const res = await get<ApiEnvelope<ParentChild[]>>("/parent/children");
  return res.data;
}

/** Every Parent page's first move: resolve which child this render is
 * scoped to. Prefers the `?studentId=` search param if it's one of this
 * parent's own real children; falls back to the first (display_order,
 * i.e. oldest grade first, same as the mobile app's own default). Returns
 * null only when this parent has no linked children at all. */
export function resolveSelectedChild(children: ParentChild[], requestedStudentId?: string): ParentChild | null {
  if (children.length === 0) return null;
  const requested = requestedStudentId ? children.find((c) => c.studentId === requestedStudentId) : undefined;
  return requested ?? children[0]!;
}

// ============================================================
// Announcements (Home feed + Notices)
// ============================================================

export interface ParentAnnouncement {
  id: string;
  title: string;
  body: string;
  category: string | null;
  priority: string;
  isEmergency: boolean;
  createdAt: string;
}

export async function listAnnouncements(studentId: string): Promise<ParentAnnouncement[]> {
  const res = await get<ApiEnvelope<ParentAnnouncement[]>>(`/parent/students/${studentId}/announcements`);
  return res.data;
}

// ============================================================
// Media Room posts (Home feed) -- same /media/posts route the Faculty
// website already calls, widened server-side to force state=PUBLISHED for
// any non-privileged caller.
// ============================================================

export interface MediaPostAsset {
  id: string;
  objectKey: string;
  url: string;
  mediaType: string;
  sortOrder: number;
}

export interface MediaPost {
  id: string;
  format: string;
  category: string;
  caption: string;
  firstComment: string | null;
  linkUrl: string | null;
  state: string;
  publishedAt: string | null;
  createdAt: string;
  assets: MediaPostAsset[];
}

export async function listPublishedMediaPosts(): Promise<MediaPost[]> {
  const res = await get<ApiEnvelope<MediaPost[]>>("/media/posts");
  return res.data;
}

// ============================================================
// Academics -- Attendance, Report Card (Results), Exams, Subjects, Current
// Term (+ Subject Detail), Timetable, Calendar.
// ============================================================

export interface AttendanceDay {
  date: string;
  status: string;
}
export interface AttendanceSummary {
  presentCount: number;
  totalCount: number;
  percentage: number;
}
export async function getAttendance(studentId: string, month?: string): Promise<{ summary: AttendanceSummary; days: AttendanceDay[] }> {
  const qs = month ? `?month=${month}` : "";
  const res = await get<ApiEnvelope<{ summary: AttendanceSummary; days: AttendanceDay[] }>>(`/parent/students/${studentId}/attendance${qs}`);
  return res.data;
}

export interface ResultsExam {
  examId: string;
  examName: string;
  examType: string;
  term: string | null;
}
export async function listResultExams(studentId: string): Promise<ResultsExam[]> {
  const res = await get<ApiEnvelope<ResultsExam[]>>(`/parent/students/${studentId}/results/exams`);
  return res.data;
}

export interface ResultSubjectRow {
  subjectName: string;
  maxMarks: number;
  marksObtained: number | null;
  isAbsent: boolean;
}
export interface ResultDetail {
  subjects: ResultSubjectRow[];
  totalObtained: number;
  totalMax: number;
  percent: number | null;
}
export async function getResults(studentId: string, examId: string): Promise<ResultDetail> {
  const res = await get<ApiEnvelope<ResultDetail>>(`/parent/students/${studentId}/results/exams/${examId}`);
  return res.data;
}

export interface ExamScheduleRow {
  examSubjectId: string;
  examName: string;
  subjectName: string;
  examDate: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  room: string | null;
  maxMarks: number;
}
export async function getExamSchedule(studentId: string): Promise<ExamScheduleRow[]> {
  const res = await get<ApiEnvelope<ExamScheduleRow[]>>(`/parent/students/${studentId}/exams`);
  return res.data;
}

export interface ParentSubject {
  subjectOfferingId: string;
  subjectId: string;
  subjectName: string;
  teacherName: string | null;
  weeklyPeriods: number | null;
  syllabusProgressPercent: number;
}
export async function listSubjects(studentId: string): Promise<ParentSubject[]> {
  const res = await get<ApiEnvelope<ParentSubject[]>>(`/parent/students/${studentId}/subjects`);
  return res.data;
}

export interface CurrentTermSubject {
  subjectOfferingId: string;
  subjectId: string;
  subjectName: string;
  teacherName: string | null;
  weeklyPeriods: number | null;
}
export async function listCurrentTerm(studentId: string): Promise<CurrentTermSubject[]> {
  const res = await get<ApiEnvelope<CurrentTermSubject[]>>(`/parent/students/${studentId}/term`);
  return res.data;
}

export interface SubjectFolder {
  id: string;
  title: string;
  description: string | null;
  fileCount: number;
}
export interface LessonPlan {
  id: string;
  title: string;
  content: string | null;
  weekStart: string | null;
}
export interface SubjectDetail {
  offering: CurrentTermSubject;
  folders: SubjectFolder[];
  lessonPlans: LessonPlan[];
}
export async function getSubjectDetail(studentId: string, subjectOfferingId: string): Promise<SubjectDetail> {
  const res = await get<ApiEnvelope<SubjectDetail>>(`/parent/students/${studentId}/term/subjects/${subjectOfferingId}`);
  return res.data;
}

export interface SubjectFile {
  id: string;
  fileName: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}
export async function getFolderFiles(studentId: string, subjectOfferingId: string, folderId: string): Promise<SubjectFile[]> {
  const res = await get<ApiEnvelope<SubjectFile[]>>(`/parent/students/${studentId}/term/subjects/${subjectOfferingId}/folders/${folderId}`);
  return res.data;
}
export async function getSubjectFileUrl(studentId: string, subjectOfferingId: string, fileId: string): Promise<string> {
  const res = await get<ApiEnvelope<{ url: string }>>(`/parent/students/${studentId}/term/subjects/${subjectOfferingId}/files/${fileId}/url`);
  return res.data.url;
}

export interface TimetablePeriod {
  periodId: string;
  periodNo: number;
  label: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}
export interface TimetableSlot {
  slotId: string;
  periodId: string;
  periodNo: number;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  room: string | null;
  subjectName: string;
  teacherName: string | null;
}
export async function getTimetable(studentId: string): Promise<{ periods: TimetablePeriod[]; slots: TimetableSlot[] }> {
  const res = await get<ApiEnvelope<{ periods: TimetablePeriod[]; slots: TimetableSlot[] }>>(`/parent/students/${studentId}/timetable`);
  return res.data;
}

export interface CalendarEvent {
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
export async function getCalendar(studentId: string): Promise<CalendarEvent[]> {
  const res = await get<ApiEnvelope<CalendarEvent[]>>(`/parent/students/${studentId}/calendar`);
  return res.data;
}

// ============================================================
// Homework -- list, submit (with file upload + note), open a submitted file.
// ============================================================

export interface ParentHomework {
  id: string;
  subjectOfferingId: string;
  subjectName: string;
  title: string;
  description: string | null;
  attachmentKeys: string[] | null;
  assignedOn: string;
  dueDate: string;
  maxMarks: number | null;
  submissionStatus: "PENDING" | "SUBMITTED" | "LATE" | "GRADED" | "NOT_DONE";
  submittedAt: string | null;
  isLate: boolean;
  objectKeys: string[] | null;
  note: string | null;
  marksAwarded: number | null;
  feedback: string | null;
}
export async function listHomework(studentId: string): Promise<ParentHomework[]> {
  const res = await get<ApiEnvelope<ParentHomework[]>>(`/parent/students/${studentId}/homework`);
  return res.data;
}

/** `files` are real File objects lifted straight out of a submitted
 * &lt;input type="file" multiple&gt; via a Server Action's own FormData
 * argument -- a genuine multipart upload, Node's fetch handles a real
 * FormData body natively (unlike the mobile app, which needed a Blob
 * workaround for React Native's own broken FormData polyfill). */
export async function submitHomework(studentId: string, homeworkId: string, form: FormData): Promise<ParentHomework> {
  const res = await postForm<ApiEnvelope<ParentHomework>>(`/parent/students/${studentId}/homework/${homeworkId}/submit`, form);
  return res.data;
}

export async function getHomeworkFileUrl(studentId: string, homeworkId: string, objectKey: string): Promise<string> {
  const qs = new URLSearchParams({ key: objectKey });
  const res = await get<ApiEnvelope<{ url: string }>>(`/parent/students/${studentId}/homework/${homeworkId}/file-url?${qs.toString()}`);
  return res.data.url;
}

// ============================================================
// Leave -- Apply + History. No attachment upload here (deliberately, same
// as the mobile app -- no storage bucket exists for leave attachments yet).
// ============================================================

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
  skipSchoolTransport: boolean;
  attachmentFileName: string | null;
  attachmentObjectKey: string | null;
  state: "PENDING" | "APPROVED" | "REJECTED";
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
  approvalRequestId: string | null;
}
export async function listLeaveRequests(studentId: string): Promise<StudentLeaveRequest[]> {
  const res = await get<ApiEnvelope<StudentLeaveRequest[]>>(`/parent/student-leave-requests?studentId=${studentId}`);
  return res.data;
}
export async function createLeaveRequest(input: {
  studentId: string;
  fromDate: string;
  toDate: string;
  reason: string;
  skipSchoolTransport?: boolean;
}): Promise<StudentLeaveRequest> {
  const res = await post<ApiEnvelope<StudentLeaveRequest>>("/parent/student-leave-requests", input);
  return res.data;
}

// ============================================================
// Library
// ============================================================

export interface LibraryIssueRow {
  id: string;
  bookId: string;
  bookTitle: string;
  copyCode: string;
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  renewedCount: number;
  status: string;
  isOverdue: boolean;
  daysOverdue: number;
  projectedFinePaise: string;
}
export interface LibrarySummary {
  hasLibraryCard: boolean;
  member?: { id: string; maxBooksAllowed: number; status: string };
  stats: { issuedCount: number; dueSoonCount: number; pendingFinePaise: string };
  borrowed: LibraryIssueRow[];
  history: LibraryIssueRow[];
}
export async function getLibrarySummary(studentId: string): Promise<LibrarySummary> {
  const res = await get<ApiEnvelope<LibrarySummary>>(`/parent/students/${studentId}/library/summary`);
  return res.data;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  categoryName: string | null;
  coverImageUrl: string | null;
  copiesSummary: { total: number; available: number; issued: number };
}
export async function searchLibraryCatalog(studentId: string, search?: string): Promise<LibraryBook[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await get<{ data: LibraryBook[] }>(`/parent/students/${studentId}/library/books${qs}`);
  return res.data;
}

// ============================================================
// Health -- read-only.
// ============================================================

export interface HealthProfile {
  bloodGroup: string | null;
  heightCm: number | null;
  weightKg: number | null;
  measuredOn: string | null;
  familyDoctor: string | null;
  doctorPhone: string | null;
  insuranceRef: string | null;
  notes: string | null;
}
export interface InfirmaryVisit {
  id: string;
  visitedAt: string;
  complaint: string;
  vitals: Record<string, unknown> | null;
  observation: string | null;
  action: string;
  outcome: string | null;
  attendedByName: string;
  parentNotifiedAt: string | null;
}
export async function getHealthOverview(studentId: string): Promise<{ profile: HealthProfile | null; visits: InfirmaryVisit[] }> {
  const res = await get<ApiEnvelope<{ profile: HealthProfile | null; visits: InfirmaryVisit[] }>>(`/parent/students/${studentId}/health`);
  return res.data;
}

// ============================================================
// Feedback -- one rating per subject, no aggregation/anonymity view.
// ============================================================

export interface FeedbackSubject {
  subjectOfferingId: string;
  subjectName: string;
  teacherName: string | null;
  myRating: number | null;
}
export async function listFeedbackSubjects(studentId: string): Promise<FeedbackSubject[]> {
  const res = await get<ApiEnvelope<FeedbackSubject[]>>(`/parent/students/${studentId}/feedback`);
  return res.data;
}
export async function submitFeedback(studentId: string, subjectOfferingId: string, rating: number): Promise<FeedbackSubject[]> {
  const res = await post<ApiEnvelope<FeedbackSubject[]>>(`/parent/students/${studentId}/feedback`, { subjectOfferingId, rating });
  return res.data;
}

// ============================================================
// Documents (Certificates)
// ============================================================

// DOCUMENT_TYPES/DocumentType live in ./document-types.ts (a plain constant
// module with zero server-only imports) so a Client Component can import
// them without pulling this whole server-only file into the client bundle.
// Re-exported here too so existing Server Component imports of DOCUMENT_TYPES
// from "@/lib/parent-api" keep working unchanged.
import { DOCUMENT_TYPES, type DocumentType } from "./document-types";
export { DOCUMENT_TYPES };
export type { DocumentType };

export interface DocumentRequest {
  id: string;
  docType: DocumentType;
  reason: string;
  state: "PENDING" | "APPROVED" | "REJECTED";
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  documentObjectKey: string | null;
  documentFileName: string | null;
}
export async function listDocumentRequests(studentId: string): Promise<DocumentRequest[]> {
  const res = await get<ApiEnvelope<DocumentRequest[]>>(`/parent/students/${studentId}/documents`);
  return res.data;
}
export async function createDocumentRequest(studentId: string, docType: DocumentType, reason: string): Promise<DocumentRequest> {
  const res = await post<ApiEnvelope<DocumentRequest>>(`/parent/students/${studentId}/documents`, { docType, reason });
  return res.data;
}
export async function getDocumentDownloadUrl(studentId: string, requestId: string): Promise<string> {
  const res = await get<ApiEnvelope<{ url: string }>>(`/parent/students/${studentId}/documents/${requestId}/download-url`);
  return res.data.url;
}

// ============================================================
// Bus -- display only, no GPS.
// ============================================================

export interface BusStop {
  stopName: string;
  sequenceNo: number;
  scheduledTime: string | null;
}
export interface BusAllocation {
  direction: string;
  stopName: string;
  scheduledTime: string | null;
  routeId: string;
  routeName: string;
  routeCode: string | null;
  vehicleId: string | null;
  registrationNo: string | null;
  model: string | null;
  driverName: string | null;
  driverPhone: string | null;
  attendantName: string | null;
  attendantPhone: string | null;
  stops: BusStop[];
}
export async function getBusAllocation(studentId: string): Promise<BusAllocation | null> {
  const res = await get<ApiEnvelope<BusAllocation | null>>(`/parent/students/${studentId}/bus`);
  return res.data;
}

// ============================================================
// Meetings -- view open slots, request a booking.
// ============================================================

export interface MeetingBooking {
  id: string;
  slotId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  rollNo: number | null;
  gradeName: string | null;
  sectionName: string | null;
  requestedBy: string;
  parentName: string;
  parentPhone: string | null;
  notes: string | null;
  state: "PENDING" | "APPROVED" | "REJECTED";
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
}
export interface MeetingSlot {
  id: string;
  staffId: string;
  facultyName: string;
  meetingDate: string;
  fromTime: string;
  toTime: string;
  createdAt: string;
  booking: MeetingBooking | null;
}
export async function listParentMeetingSlots(studentId: string): Promise<MeetingSlot[]> {
  const res = await get<ApiEnvelope<MeetingSlot[]>>(`/parent/meeting-slots?studentId=${studentId}`);
  return res.data;
}
export async function createParentMeetingBooking(input: { slotId: string; studentId: string; notes?: string }): Promise<MeetingBooking> {
  const res = await post<ApiEnvelope<MeetingBooking>>("/parent/meeting-bookings", input);
  return res.data;
}

// ============================================================
// Profile
// ============================================================

export interface StudentProfile {
  firstName: string;
  lastName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  photoUrl: string | null;
  admissionNo: string;
  bloodGroup: string | null;
  gradeName: string | null;
  sectionName: string | null;
  mediumName: string | null;
  rollNo: number | null;
}
export async function getStudentProfile(studentId: string): Promise<StudentProfile> {
  const res = await get<ApiEnvelope<StudentProfile>>(`/parent/students/${studentId}/profile`);
  return res.data;
}
