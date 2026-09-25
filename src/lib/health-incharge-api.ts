// Health In-charge console: typed reads against GET /health-incharge/*
// (school-eos-backend/src/modules/health/health-incharge.controller.ts, HEALTH_INCHARGE only).
// Writes live in app/(dashboard)/health-incharge/actions.ts.

import { apiFetch } from "@/lib/api";

export * from "./health-incharge-shared";
import type { HealthDashboard, StudentLookup, StudentHealth, VisitRow, AlertRow, EscalationRow } from "./health-incharge-shared";

async function get<T>(path: string): Promise<T> {
  const res = await apiFetch(`/health-incharge${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(Array.isArray(body?.message) ? body.message.join(" ") : (body?.message ?? `Could not load (${res.status})`));
  }
  return ((await res.json()) as { data: T }).data;
}

export const getHealthDashboard = () => get<HealthDashboard>("/dashboard");
export const searchHealthStudents = (search: string) => get<StudentLookup[]>(`/students?search=${encodeURIComponent(search)}`);
export const getStudentHealth = (id: string) => get<StudentHealth>(`/students/${id}`);

export function listHealthVisits(q: { studentId?: string; action?: string; from?: string; to?: string; needsParentNotice?: boolean } = {}) {
  const p = new URLSearchParams();
  if (q.studentId) p.set("studentId", q.studentId);
  if (q.action) p.set("action", q.action);
  if (q.from) p.set("from", q.from);
  if (q.to) p.set("to", q.to);
  if (q.needsParentNotice) p.set("needsParentNotice", "true");
  const qs = p.toString();
  return get<VisitRow[]>(`/visits${qs ? `?${qs}` : ""}`);
}

export const listHealthAlerts = (status?: "open" | "done") => get<AlertRow[]>(`/alerts${status ? `?status=${status}` : ""}`);
export const listHealthEscalations = () => get<EscalationRow[]>("/escalations");
