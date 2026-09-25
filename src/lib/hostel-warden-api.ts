// Server-side-only Hostel Warden API client -- every call goes through apiFetch
// (Server Actions/Server Components only), same convention as library-api.ts/
// faculty-*-api.ts. Ported 1:1 from the real, mobile-proven client
// (school-eos-mobile/src/lib/hostel-warden-api.ts) -- same endpoints, same row
// shapes, verified against that app's own live use of school-eos-backend's
// src/modules/hostel-warden + src/modules/hostel read-only repositories.
//
// Parent-initiated creation (gate-pass-requests, emergency-exit-requests,
// call-requests under /parent/hostel/*) intentionally has NO functions here --
// the Warden portal only reviews those requests, never creates them.

import { apiFetch } from "./api";
import {
  HOSTEL_COMPLAINT_ALLOWED_TRANSITIONS,
  HOSTEL_COMPLAINT_STATES,
  HOSTEL_ISSUE_TYPES,
  HOSTEL_ISSUE_TYPE_LABELS,
  MOVEMENT_LOG_PURPOSES,
  MOVEMENT_LOG_PURPOSE_LABELS,
  type HostelComplaintState,
  type HostelIssueType,
  type MovementLogPurpose,
  type NightAttendanceStatus,
} from "./hostel-warden-constants";

// Re-exported so existing server-side callers can keep importing everything
// from this one module -- the client-safe split lives in
// hostel-warden-constants.ts (see that file's own header comment for why).
export {
  HOSTEL_COMPLAINT_ALLOWED_TRANSITIONS,
  HOSTEL_COMPLAINT_STATES,
  HOSTEL_ISSUE_TYPES,
  HOSTEL_ISSUE_TYPE_LABELS,
  MOVEMENT_LOG_PURPOSES,
  MOVEMENT_LOG_PURPOSE_LABELS,
  type HostelComplaintState,
  type HostelIssueType,
  type MovementLogPurpose,
  type NightAttendanceStatus,
};

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
  const res = await apiFetch(path);
  return (await parseOrThrow<ApiEnvelope<T>>(res)).data;
}

async function send<T>(path: string, method: "POST" | "PATCH", body?: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return (await parseOrThrow<ApiEnvelope<T>>(res)).data;
}

// ---------- Night Attendance ----------
// (NightAttendanceStatus now lives in hostel-warden-constants.ts, re-exported above)

export interface NightAttendanceRosterRow {
  studentId: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  roomNo: string | null;
  bedNo: string | null;
  blockId: string | null;
  blockName: string | null;
  floorNo: number | null;
  attendanceId: string | null;
  status: NightAttendanceStatus | null;
  recordedAt: string | null;
  hasApprovedLeaveToday: boolean;
}

export function getNightAttendanceRoster(date: string): Promise<NightAttendanceRosterRow[]> {
  return get(`/hostel/night-attendance?date=${encodeURIComponent(date)}`);
}

export function markNightAttendance(
  date: string,
  entries: { studentId: string; status: NightAttendanceStatus }[],
): Promise<{ marked: number; date: string }> {
  return send("/hostel/night-attendance", "POST", { date, entries });
}

// ---------- Study Attendance ----------

export interface StudySessionSummary {
  id: string;
  hostelId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  createdByStaffId: string | null;
  isLocked: boolean;
  createdAt: string;
}

export interface StudyAttendanceRosterRow {
  studentId: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  attendanceId: string | null;
  status: NightAttendanceStatus | null;
  recordedAt: string | null;
}

export function listStudySessions(): Promise<StudySessionSummary[]> {
  return get("/hostel/study-sessions");
}

export function createStudySession(input: {
  sessionDate: string;
  startTime: string;
  endTime: string;
}): Promise<StudySessionSummary> {
  return send("/hostel/study-sessions", "POST", input);
}

export function getStudySessionRoster(
  sessionId: string,
): Promise<{ session: StudySessionSummary; roster: StudyAttendanceRosterRow[] }> {
  return get(`/hostel/study-sessions/${sessionId}/attendance`);
}

export function markStudyAttendance(
  sessionId: string,
  entries: { studentId: string; status: NightAttendanceStatus }[],
): Promise<{ marked: number }> {
  return send(`/hostel/study-sessions/${sessionId}/attendance`, "POST", { entries });
}

// ---------- Gate Pass / Emergency Exit (both backed by outing_request) ----------

export interface OutingRequestRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  requestedBy: string | null;
  requestedAt: string;
  outFrom: string;
  expectedReturn: string;
  isOvernight: boolean;
  reason: string;
  destination: string | null;
  approvalRequestId: string | null;
  state: string;
  requestType: string | null;
  calledByName: string | null;
  calledByPhone: string | null;
  purposeCategory: MovementLogPurpose | null;
  actualReturnAt: string | null;
}

type OutingKind = "gate-pass-requests" | "emergency-exit-requests";

function listOutingRequests(kind: OutingKind): Promise<OutingRequestRow[]> {
  return get(`/hostel/${kind}`);
}

function getOutingRequest(kind: OutingKind, id: string): Promise<OutingRequestRow> {
  return get(`/hostel/${kind}/${id}`);
}

function decideOutingRequest(
  kind: OutingKind,
  id: string,
  decision: "approve" | "reject",
  comment: string | undefined,
): Promise<OutingRequestRow> {
  return send(`/hostel/${kind}/${id}/${decision}`, "POST", comment !== undefined ? { comment } : {});
}

export const listGatePassRequests = () => listOutingRequests("gate-pass-requests");
export const getGatePassRequest = (id: string) => getOutingRequest("gate-pass-requests", id);
export const approveGatePassRequest = (id: string, comment?: string) =>
  decideOutingRequest("gate-pass-requests", id, "approve", comment);
// Reject requires a comment on the backend (RejectApprovalDto) -- never optional here.
export const rejectGatePassRequest = (id: string, comment: string) =>
  decideOutingRequest("gate-pass-requests", id, "reject", comment);

export const listEmergencyExitRequests = () => listOutingRequests("emergency-exit-requests");
export const getEmergencyExitRequest = (id: string) => getOutingRequest("emergency-exit-requests", id);
export const approveEmergencyExitRequest = (id: string, comment?: string) =>
  decideOutingRequest("emergency-exit-requests", id, "approve", comment);
export const rejectEmergencyExitRequest = (id: string, comment: string) =>
  decideOutingRequest("emergency-exit-requests", id, "reject", comment);

// ---------- Movement Log (Warden-authored, real -- see backend's own
// outing-request.repository.ts createDirect/findDirectEntriesForHostels
// comments and migration 0021_outing_request_movement_log_fields.sql;
// MOVEMENT_LOG_PURPOSES/LABELS live in hostel-warden-constants.ts and are
// re-exported above so client components can import them safely) ----------

export function listMovementLogEntries(): Promise<OutingRequestRow[]> {
  return get("/hostel/movement-log");
}

export function createMovementLogEntry(input: {
  studentId: string;
  purposeCategory: MovementLogPurpose;
  reason: string;
  calledByName: string;
  calledByPhone: string;
  outFrom: string;
  expectedReturn: string;
  isOvernight?: boolean;
}): Promise<OutingRequestRow> {
  return send("/hostel/movement-log", "POST", input);
}

export function recordMovementLogReturn(id: string): Promise<OutingRequestRow> {
  return send(`/hostel/movement-log/${id}/return`, "POST");
}

export function amendMovementLogEntry(
  id: string,
  input: { expectedReturn?: string; reason?: string; calledByName?: string; calledByPhone?: string },
): Promise<OutingRequestRow> {
  return send(`/hostel/movement-log/${id}`, "PATCH", input);
}

// ---------- Call Requests ----------

export type CallRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CallRequestRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  parentPersonId: string;
  hostelId: string;
  requestedFrom: string;
  requestedTo: string;
  status: CallRequestStatus;
  approvedFrom: string | null;
  approvedTo: string | null;
  decidedByPersonId: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function listCallRequests(): Promise<CallRequestRow[]> {
  return get("/hostel/call-requests");
}

export function getCallRequest(id: string): Promise<CallRequestRow> {
  return get(`/hostel/call-requests/${id}`);
}

export function approveCallRequest(
  id: string,
  window: { approvedFrom: string; approvedTo: string },
): Promise<CallRequestRow> {
  return send(`/hostel/call-requests/${id}/approve`, "POST", window);
}

export function rejectCallRequest(id: string): Promise<CallRequestRow> {
  return send(`/hostel/call-requests/${id}/reject`, "POST");
}

// ---------- Visitor Log ----------

export interface VisitorRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  visitorName: string;
  relationship: string | null;
  idProofRef: string | null;
  phone: string | null;
  enteredAt: string;
  exitedAt: string | null;
  recordedBy: string | null;
}

export function listVisitors(status?: "open"): Promise<VisitorRow[]> {
  return get(`/hostel/visitors${status ? `?status=${status}` : ""}`);
}

export function getVisitor(id: string): Promise<VisitorRow> {
  return get(`/hostel/visitors/${id}`);
}

export function createVisitor(input: {
  studentId: string;
  visitorName: string;
  relationship?: string;
  idProofRef?: string;
  phone?: string;
}): Promise<VisitorRow> {
  return send("/hostel/visitors", "POST", input);
}

export function exitVisitor(id: string): Promise<VisitorRow> {
  return send(`/hostel/visitors/${id}/exit`, "POST");
}

// ---------- Class Absence Alerts (read-only) ----------

export interface ClassAbsenceAlertRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  title: string;
  body: string;
  createdAt: string;
}

export function listClassAbsenceAlerts(date?: string): Promise<ClassAbsenceAlertRow[]> {
  return get(`/hostel/class-absence-alerts${date ? `?date=${encodeURIComponent(date)}` : ""}`);
}

// ---------- Room & Bed View (read-only) ----------

export interface HostelAllocationRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  admissionNo: string;
  stateStudentId: string | null;
  rollNo: number | null;
  photoUrl: string | null;
  bedId: string;
  bedNo: string;
  roomId: string;
  roomNo: string;
  floorNo: number;
  blockId: string;
  blockName: string;
  hostelName: string;
  gradeName: string | null;
  sectionName: string | null;
  academicYearId: string;
  allocatedFrom: string;
  allocatedTo: string | null;
  allocatedBy: string | null;
  status: string;
}

export function listRoomAllocations(): Promise<HostelAllocationRow[]> {
  return get("/hostel/room-allocations");
}

export function getStudentRoom(studentId: string): Promise<HostelAllocationRow> {
  return get(`/hostel/students/${studentId}/room`);
}

export interface StudentGuardianRow {
  personId: string;
  firstName: string;
  lastName: string | null;
  relationship: string;
  isPrimaryContact: boolean;
  mobile: string | null;
  photoUrl: string | null;
}

export function listStudentGuardians(studentId: string): Promise<StudentGuardianRow[]> {
  return get(`/hostel/students/${studentId}/guardians`);
}

export interface HostelStructureRoom {
  id: string;
  roomNo: string;
  floorNo: number;
  // Real bed_capacity column -- added to this endpoint's response server-side
  // this build (it was already being queried by the repository but silently
  // dropped before reaching the client); see room-bed-view.service.ts.
  bedCapacity: number;
}

export interface HostelStructureBlock {
  id: string;
  hostelId: string;
  name: string;
  rooms: HostelStructureRoom[];
}

// Feeds block/room pickers with real ids (complaint.block_id/room_id are real
// FKs, not free text) -- scoped server-side to the Warden's own hostel(s).
export function listHostelStructure(): Promise<HostelStructureBlock[]> {
  return get("/hostel/blocks");
}

// ---------- Warden roster ----------

export interface WardenRosterRow {
  personId: string;
  firstName: string;
  lastName: string | null;
  mobile: string | null;
  hostelId: string;
  hostelName: string;
}

// Real co-wardens across exactly this caller's own hostel(s) -- see the
// backend's own warden-assignment.repository.ts findRosterForHostels
// comment for why this is scoped this way, never a school-wide staff list.
export function listWardenRoster(): Promise<WardenRosterRow[]> {
  return get("/hostel/warden-roster");
}

export interface StudentFeeDemandRow {
  id: string;
  amountPaise: string;
  lateFeePaise: string;
  paidPaise: string;
  state: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
  dueDate?: string;
  [key: string]: unknown;
}

export type StudentFeeOverallStatus = "NO_ASSIGNMENT" | "PAID" | "PARTIAL" | "PENDING" | "OVERDUE";

export interface StudentFeeSummary {
  assignment: { id: string; [key: string]: unknown } | null;
  demands: StudentFeeDemandRow[];
  payments: { id: string; amountPaise: string; paidAt: string; [key: string]: unknown }[];
  totalDuePaise: string;
  totalPaidPaise: string;
  totalPendingPaise: string;
  totalOverduePaise: string;
  overallStatus: StudentFeeOverallStatus;
}

// Reuses Finance's own StudentFeesService.getSummaryForStudent -- same reuse
// pattern as /faculty/students/:id, added server-side this build at
// /hostel/students/:studentId/fees (see room-bed-view.service.ts). Scoped to
// the Warden's own hostel(s) the same way getStudentRoom/getStudentGuardians
// are -- 404s for a student outside their scope, fee data never leaks.
export function getStudentFees(studentId: string): Promise<StudentFeeSummary> {
  return get(`/hostel/students/${studentId}/fees`);
}

// ---------- Hostel Complaints ----------
// (HOSTEL_ISSUE_TYPES/_LABELS, HOSTEL_COMPLAINT_STATES/_ALLOWED_TRANSITIONS
// now live in hostel-warden-constants.ts, re-exported above)

export interface HostelComplaintRow {
  id: string;
  hostelId: string;
  blockId: string | null;
  roomId: string | null;
  issueType: string;
  subject: string;
  description: string;
  raisedByPersonId: string | null;
  assignedTo: string | null;
  state: HostelComplaintState;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function listComplaints(): Promise<HostelComplaintRow[]> {
  return get("/hostel/complaints");
}

export function getComplaint(id: string): Promise<HostelComplaintRow> {
  return get(`/hostel/complaints/${id}`);
}

export function createComplaint(input: {
  issueType: HostelIssueType;
  subject: string;
  description: string;
  blockId?: string;
  roomId?: string;
}): Promise<HostelComplaintRow> {
  return send("/hostel/complaints", "POST", input);
}

export function updateComplaintStatus(id: string, state: HostelComplaintState): Promise<HostelComplaintRow> {
  return send(`/hostel/complaints/${id}`, "PATCH", { state });
}
