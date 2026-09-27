// Principal-specific API calls. Deliberately small -- per the approved API
// documentation (Principal: "dashboard/approvals on mobile, full reports on web"),
// web's Principal Dashboard stays light. Pending approvals reuse the existing
// generic engine's own functions in lib/finance-api.ts (listApprovals et al.) --
// not duplicated here.

import { apiFetch } from "./api";
import { parseApiResponse } from "./api-response";

export interface ApiEnvelope<T> {
  data: T;
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  return parseApiResponse<T>(res);
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
  studentAttendanceToday: { hostellersPresent: number; dayScholarsPresent: number };
  staffAttendanceToday: { teachingPresent: number; supportPresent: number };
  activeSectionsCount: number;
  // Correspondent Phase 5 addition -- real operational KPIs, each read from
  // that module's own existing overview service on the backend (see
  // principal-dashboard.service.ts's own comment).
  inventoryLowStockCount: number;
  inventoryDamagedCount: number;
  maintenanceOpenRequestsCount: number;
  sportsUpcomingFixturesCount: number;
  libraryOverdueCount: number;
  // Correspondent Phase 8 addition -- real vehicle_document/driver_document
  // expiry counts (see principal-dashboard.service.ts).
  complianceExpiringCount: number;
  complianceOverdueCount: number;
  generatedAt: string;
}

export async function getPrincipalDashboardSummary(): Promise<PrincipalDashboardSummary> {
  const res = await apiFetch("/principal/dashboard-summary");
  return (await parseOrThrow<ApiEnvelope<PrincipalDashboardSummary>>(res)).data;
}

export interface PrincipalStudentsOverview {
  presentToday: { present: number; total: number };
  // null when no PUBLISHED exam has any results yet -- never a fabricated 0%.
  passPercentage: { passed: number; total: number } | null;
  hostelCount: number;
  transportCount: number;
}

export async function getPrincipalStudentsOverview(): Promise<PrincipalStudentsOverview> {
  const res = await apiFetch("/principal/students-overview");
  return (await parseOrThrow<ApiEnvelope<PrincipalStudentsOverview>>(res)).data;
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
