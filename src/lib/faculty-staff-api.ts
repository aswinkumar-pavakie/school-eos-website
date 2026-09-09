// Faculty's own employment record -- My Attendance (read-only), Leave & OD,
// HR Payroll, Payslip, Appraisal, Library. Same server-only apiFetch
// convention as faculty-api.ts.

import { apiFetch } from "./api";
import type { ApprovalStepSummary } from "./faculty-api";

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

// ============================================================
// Employee Attendance (read-only)
// ============================================================

export interface MyAttendanceDay {
  date: string;
  status: "PRESENT" | "ABSENT" | "ON_DUTY" | null;
  punchIn: string | null;
  punchOut: string | null;
  hoursWorked: number | null;
}
export interface MyAttendanceSummary {
  today: MyAttendanceDay;
  summary: { ratePercent: number | null; presentCount: number; absentCount: number; onDutyCount: number; workingDays: number };
  days: MyAttendanceDay[];
}
export async function getMyAttendance(month?: string): Promise<MyAttendanceSummary> {
  return (await get<ApiEnvelope<MyAttendanceSummary>>(`/faculty/my-attendance${month ? `?month=${month}` : ""}`)).data;
}

// ============================================================
// Employee Leave & OD
// ============================================================

export interface StaffLeaveRequest {
  id: string;
  staffId: string;
  leaveType: "CASUAL" | "MEDICAL" | "EARNED" | "ON_DUTY";
  fromDate: string;
  toDate: string;
  reason: string;
  attachmentObjectKey: string | null;
  attachmentFileName: string | null;
  state: string;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
  approvalRequestId: string | null;
  approvalTrail: ApprovalStepSummary[];
}
export async function listStaffLeave(): Promise<StaffLeaveRequest[]> {
  return (await get<ApiEnvelope<StaffLeaveRequest[]>>("/faculty/staff-leave")).data;
}
export async function getStaffLeave(id: string): Promise<StaffLeaveRequest> {
  return (await get<ApiEnvelope<StaffLeaveRequest>>(`/faculty/staff-leave/${id}`)).data;
}
export async function createStaffLeave(input: {
  leaveType: string; fromDate: string; toDate: string; reason: string; attachmentObjectKey?: string; attachmentFileName?: string;
}): Promise<StaffLeaveRequest> {
  return (await post<ApiEnvelope<StaffLeaveRequest>>("/faculty/staff-leave", input)).data;
}

// ============================================================
// HR Payroll
// ============================================================

export interface StaffHrRequest {
  id: string;
  staffId: string;
  category: string;
  subject: string;
  description: string | null;
  attachmentObjectKey: string | null;
  attachmentFileName: string | null;
  state: string;
  approvalRequestId: string | null;
  createdAt: string;
  approvalTrail: ApprovalStepSummary[];
}
export async function listHrRequests(): Promise<StaffHrRequest[]> {
  return (await get<ApiEnvelope<StaffHrRequest[]>>("/faculty/hr-requests")).data;
}
export async function getHrRequest(id: string): Promise<StaffHrRequest> {
  return (await get<ApiEnvelope<StaffHrRequest>>(`/faculty/hr-requests/${id}`)).data;
}
export async function createHrRequest(input: { category: string; subject: string; description?: string; attachmentObjectKey?: string; attachmentFileName?: string }): Promise<StaffHrRequest> {
  return (await post<ApiEnvelope<StaffHrRequest>>("/faculty/hr-requests", input)).data;
}

// ============================================================
// Payslip
// ============================================================

export interface Payslip {
  id: string;
  payrollPeriodId: string;
  month: number;
  year: number;
  grossPaise: string;
  deductionsPaise: string;
  netPaise: string;
  breakdown: Record<string, number> | null;
  pdfObjectKey: string | null;
}
export async function listPayslips(): Promise<Payslip[]> {
  return (await get<ApiEnvelope<Payslip[]>>("/faculty/payslip")).data;
}
export async function getPayslip(id: string): Promise<Payslip> {
  return (await get<ApiEnvelope<Payslip>>(`/faculty/payslip/${id}`)).data;
}
export interface PayslipAccessRequest extends StaffHrRequest {}
export async function getPayslipRequestStatus(): Promise<{ requests: PayslipAccessRequest[]; hasAccess: boolean }> {
  return (await get<ApiEnvelope<{ requests: PayslipAccessRequest[]; hasAccess: boolean }>>("/faculty/payslip/request-status")).data;
}
export async function requestPayslipAccess(note?: string): Promise<StaffHrRequest> {
  return (await post<ApiEnvelope<StaffHrRequest>>("/faculty/payslip/request", note ? { note } : undefined)).data;
}

// ============================================================
// Appraisal
// ============================================================

export interface StaffAppraisal {
  id: string;
  staffId: string;
  cycle: string;
  selfAssessment: string;
  attachmentObjectKey: string | null;
  attachmentFileName: string | null;
  score: number | null;
  principalRemark: string | null;
  state: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  approvalRequestId: string | null;
  approvalTrail: ApprovalStepSummary[];
}
export async function listAppraisals(): Promise<StaffAppraisal[]> {
  return (await get<ApiEnvelope<StaffAppraisal[]>>("/faculty/appraisal")).data;
}
export async function createAppraisal(input: { cycle: string; selfAssessment: string; attachmentObjectKey?: string; attachmentFileName?: string }): Promise<StaffAppraisal> {
  return (await post<ApiEnvelope<StaffAppraisal>>("/faculty/appraisal", input)).data;
}

// ============================================================
// Library (read-only)
// ============================================================

export interface LibraryBook {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  edition: string | null;
  categoryId: string | null;
  categoryName: string | null;
  publicationYear: number | null;
  language: string | null;
  description: string | null;
  coverImageUrl: string | null;
  status: string;
  copiesSummary: { total: number; available: number; issued: number };
}
export async function listLibraryBooks(params: { search?: string; categoryId?: string } = {}): Promise<{ data: LibraryBook[]; meta: { page: number; limit: number; total: number } }> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.categoryId) qs.set("categoryId", params.categoryId);
  qs.set("limit", "100");
  return get(`/faculty/library/books${qs.toString() ? `?${qs}` : ""}`);
}
export interface LibraryCategory {
  id: string;
  name: string;
  status: string;
}
export async function listLibraryCategories(): Promise<LibraryCategory[]> {
  return (await get<ApiEnvelope<LibraryCategory[]>>("/faculty/library/categories")).data;
}
export interface LibraryIssue {
  id: string;
  copyId: string;
  copyCode: string;
  bookId: string;
  bookTitle: string;
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  renewedCount: number;
  status: string;
  isOverdue: boolean;
  daysOverdue: number;
  projectedFinePaise: string;
}
export async function listMyIssues(): Promise<{ data: LibraryIssue[]; hasLibraryCard: boolean }> {
  return get("/faculty/library/my-issues?limit=100");
}

// ============================================================
// Parent Meetings
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
  meetingDate: string;
  fromTime: string;
  toTime: string;
  createdAt: string;
  booking: MeetingBooking | null;
  pastBookings: MeetingBooking[];
}
export async function listMeetingSlots(): Promise<MeetingSlot[]> {
  return (await get<ApiEnvelope<MeetingSlot[]>>("/faculty/parent-meetings/slots")).data;
}
export async function createMeetingSlot(input: { meetingDate: string; fromTime: string; toTime: string }): Promise<MeetingSlot> {
  return (await post<ApiEnvelope<MeetingSlot>>("/faculty/parent-meetings/slots", input)).data;
}
export async function updateMeetingSlot(id: string, input: Partial<{ meetingDate: string; fromTime: string; toTime: string }>): Promise<MeetingSlot> {
  const res = await apiFetch(`/faculty/parent-meetings/slots/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  return (await parseOrThrow<ApiEnvelope<MeetingSlot>>(res)).data;
}
export async function deleteMeetingSlot(id: string): Promise<void> {
  const res = await apiFetch(`/faculty/parent-meetings/slots/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed (${res.status})`);
  }
}
export async function decideMeetingBooking(bookingId: string, decision: "APPROVED" | "REJECTED"): Promise<void> {
  await post(`/faculty/parent-meetings/bookings/${bookingId}/decide`, { decision });
}
