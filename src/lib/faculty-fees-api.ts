// Faculty "Fees" -- real, live data via GET /faculty/fees?sectionId=
// (faculty-fees.controller.ts), a new section-scoped, advisor-authorized
// read over the same fee_demand table the ADMIN-only FeeDemandsController
// already reads. No schema change.

import { apiFetch } from "./api";
import { parseApiResponse } from "./api-response";

export interface ApiEnvelope<T> {
  data: T;
}
async function parseOrThrow<T>(res: Response): Promise<T> {
  return parseApiResponse<T>(res);
}
async function get<T>(path: string): Promise<T> {
  return parseOrThrow<T>(await apiFetch(path));
}

export interface SectionFeeRow {
  studentId: string;
  studentName: string;
  rollNo: number | null;
  parentName: string | null;
  status: "OVERDUE" | "DUE" | "PAID";
  amountPending: number;
  term: string;
  dueDate: string;
}
export interface SectionFeesSummary {
  studentsWithDues: number;
  totalStudents: number;
  overdueCount: number;
  dueCount: number;
  paidCount: number;
  rows: SectionFeeRow[];
}

export async function getSectionFees(sectionId: string): Promise<SectionFeesSummary> {
  return (await get<ApiEnvelope<SectionFeesSummary>>(`/faculty/fees?sectionId=${sectionId}`)).data;
}
