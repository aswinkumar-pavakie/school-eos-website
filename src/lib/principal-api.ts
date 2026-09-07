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
  generatedAt: string;
}

export async function getPrincipalDashboardSummary(): Promise<PrincipalDashboardSummary> {
  const res = await apiFetch("/principal/dashboard-summary");
  return (await parseOrThrow<ApiEnvelope<PrincipalDashboardSummary>>(res)).data;
}
