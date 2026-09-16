// Principal-specific API calls. Deliberately small -- per the approved API
// documentation (Principal: "dashboard/approvals on mobile, full reports on web"),
// web's Principal Dashboard stays light. Pending approvals reuse the existing
// generic engine's own functions in lib/finance-api.ts (listApprovals et al.) --
// not duplicated here.

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

export interface PrincipalDashboardSummary {
  activeStudents: number;
  activeStaff: number;
  currentAcademicYear: { id: string; name: string; startDate: string; endDate: string } | null;
  parentLoginsIssued: { issued: number; totalFamilies: number };
  hostelOccupancy: { occupiedBeds: number; totalBeds: number };
  vehiclesCount: number;
  subjectsCount: number;
  staffMarkedToday: { present: number; absent: number; onLeave: number; total: number };
  needsAttention: { label: string; sub: string; count: number }[];
  staffSplit: { teaching: number; support: number };
  studentResidence: { hostellers: number; dayScholars: number };
  activeSectionsCount: number;
  generatedAt: string;
}

export async function getPrincipalDashboardSummary(): Promise<PrincipalDashboardSummary> {
  const res = await apiFetch("/principal/dashboard-summary");
  return (await parseOrThrow<ApiEnvelope<PrincipalDashboardSummary>>(res)).data;
}

// Subjects & mapping (design-reframe addition) -- real subject_offering table,
// already fully populated, previously Admin-only with no school-wide read
// route; see subject-offerings.controller.ts's own comment for the PRINCIPAL
// GET grant this reuses.
export interface SubjectOffering {
  id: string;
  academicYearId: string;
  sectionId: string;
  gradeName: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  teacherStaffId: string | null;
  teacherFirstName: string | null;
  teacherLastName: string | null;
  isPractical: boolean;
  weeklyPeriods: number;
  status: string;
}

export async function listAllSubjectOfferings(): Promise<SubjectOffering[]> {
  const res = await apiFetch("/subject-offerings/all");
  return (await parseOrThrow<ApiEnvelope<SubjectOffering[]>>(res)).data;
}
