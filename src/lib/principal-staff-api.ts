// Principal's own employment self-service -- My Attendance (read-only) and My
// Leave. Backed by GET /staff/me/attendance-history and
// GET/POST /staff/me/leave-requests(/:id, /:id/withdraw) -- confirmed via
// direct backend audit (staff.controller.ts) already @Roles('ADMIN',
// 'PRINCIPAL', 'VICE_PRINCIPAL'), self-scoped server-side (staffId resolved
// from the caller's own personId, never client-supplied). This exact same
// backend surface already backs Principal's own mobile "My Attendance"/
// "My Leave" screens (school-eos-mobile/src/lib/principal-my-attendance-api.ts,
// principal-my-leave-api.ts) -- this file is that same real capability,
// reused for the web Principal Console, which had no equivalent page yet.
//
// Note (disclosed, not fixed here): STAFF_LEAVE_REQUEST's only approval_policy
// routes to approver_role_code 'PRINCIPAL' -- when the Principal is the one
// submitting their own leave, the generic approvals engine's own
// requestedBy-self-check (approvals.service.ts) correctly blocks them from
// deciding their own request, so there is no self-approval hole, but there is
// also no one else who currently can approve/reject it (it stays PENDING
// unless another PRINCIPAL-role account exists). That is a real, pre-existing
// approval-routing gap in the data, not something this page introduces --
// Principal's mobile "My Leave" screen has the identical characteristic.

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
    await apiFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  );
}

// ============================================================
// My Attendance (read-only)
// ============================================================

export interface MyAttendanceDay {
  date: string;
  status: "CHECK_IN" | "ABSENT";
  occurredAt: string;
  reason: string | null;
}
export interface MyAttendanceCounts {
  presentCount: number;
  totalCount: number;
  percentage: number | null;
}
export interface MyAttendanceHistory {
  month: string;
  monthlySummary: MyAttendanceCounts;
  allTimeSummary: MyAttendanceCounts;
  days: MyAttendanceDay[];
}
export async function getMyAttendanceHistory(month?: string): Promise<MyAttendanceHistory> {
  return (await get<ApiEnvelope<MyAttendanceHistory>>(`/staff/me/attendance-history${month ? `?month=${month}` : ""}`)).data;
}

// ============================================================
// My Leave
// ============================================================

export type StaffLeaveType = "CASUAL" | "MEDICAL" | "EARNED" | "ON_DUTY";

export interface MyLeaveRequest {
  id: string;
  staffId: string;
  leaveType: StaffLeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
  attachmentObjectKey: string | null;
  attachmentFileName: string | null;
  state: string;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  approvalRequestId: string | null;
  approvalState: string | null;
}

export async function listMyLeaveRequests(): Promise<MyLeaveRequest[]> {
  return (await get<ApiEnvelope<MyLeaveRequest[]>>("/staff/me/leave-requests")).data;
}

export interface CreateMyLeaveInput {
  leaveType: StaffLeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
}
export async function createMyLeaveRequest(input: CreateMyLeaveInput): Promise<MyLeaveRequest> {
  return (await post<ApiEnvelope<MyLeaveRequest>>("/staff/me/leave-requests", input)).data;
}

export async function withdrawMyLeaveRequest(id: string): Promise<void> {
  await post(`/staff/me/leave-requests/${id}/withdraw`);
}
