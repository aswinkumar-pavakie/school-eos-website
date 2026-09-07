// Server-side-only Reports & Analytics API client -- mirrors library-api.ts's own
// shape (ApiEnvelope<T>, parseOrThrow, one typed function for the one endpoint this
// page reads). GET /admin/reports-summary is a single read-only aggregation; every
// figure comes from a real query, nothing here is placeholder.

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

export interface ReportsSummary {
  enrollment: {
    byGrade: { gradeName: string; count: number }[];
    byGender: { gender: string; count: number }[];
    activeCount: number;
    inactiveCount: number;
  };
  staff: {
    byDesignation: { designation: string; count: number }[];
    teachingCount: number;
    nonTeachingCount: number;
  };
  attendance: {
    dailyPercentPresent: { date: string; percentPresent: number }[];
  };
  fees: {
    byState: { state: string; count: number }[];
    totalOutstandingPaise: string | number;
  };
  transport: {
    ridershipByRoute: { routeName: string; count: number }[];
    vehiclesByStatus: { status: string; count: number }[];
  };
  hostel: {
    occupancyByHostel: { hostelName: string; occupied: number; vacant: number }[];
  };
  inventory: {
    byStatus: { status: string; count: number }[];
  };
  library: {
    byStatus: { status: string; count: number }[];
    outstandingFinesPaise: string | number;
  };
  requestsApprovals: {
    byState: { state: string; count: number }[];
    byType: { requestType: string; count: number }[];
  };
  generatedAt: string;
}

export async function getReportsSummary(): Promise<ReportsSummary> {
  const res = await apiFetch("/admin/reports-summary");
  return (await parseOrThrow<ApiEnvelope<ReportsSummary>>(res)).data;
}
