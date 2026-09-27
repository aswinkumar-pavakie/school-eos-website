// Attendance Diary -- server-only access to GET /attendance-diary/*. Tokens stay in httpOnly
// cookies (see lib/api.ts); the browser never sees them and never calls the backend directly.
// Scope (which classes / which employees a caller may see) is decided by the BACKEND from the
// caller's own role mappings -- this file never widens or narrows it.

import { apiFetch } from "./api";
import { parseApiResponse } from "./api-response";

export type DiaryStudentDayStatus = "PRESENT" | "ABSENT" | "LATE" | "NOT_MARKED";
export type DiaryEmployeeDayStatus = "PRESENT" | "ABSENT" | "ON_DUTY" | "ON_LEAVE" | "NOT_MARKED";

export interface DiaryContext {
  today: string;
  date: string;
  academicYear: { id: string; name: string; startDate: string; endDate: string } | null;
  access: { kind: "FULL" | "SCOPED"; role: string; roleLabel: string; canViewEmployees: boolean; profileMode: "FULL" | "ATTENDANCE"; classCount: number };
  grades: { id: string; name: string; levelNo: number; stage: string }[];
  sections: { id: string; gradeId: string; gradeName: string; name: string }[];
  departments: { id: string; name: string }[];
}

export interface DiaryStudentRow {
  studentId: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  rollNo: number | null;
  gradeId: string;
  gradeName: string;
  sectionId: string;
  sectionName: string;
  isHosteller: boolean;
  usesSchoolTransport: boolean;
  gender: string | null;
  photoObjectKey: string | null;
  dayStatus: DiaryStudentDayStatus | string;
  reason: string | null;
  markedAt: string | null;
  totalDays: number;
  presentDays: number;
  percentage: number | null;
}

export interface DiaryEmployeeRow {
  staffId: string;
  personId: string;
  firstName: string;
  lastName: string | null;
  employeeNo: string;
  designation: string | null;
  group: "PRINCIPAL" | "VICE_PRINCIPAL" | "FACULTY";
  departmentId: string | null;
  departmentName: string | null;
  photoObjectKey: string | null;
  dayStatus: DiaryEmployeeDayStatus | string;
  eventAt: string | null;
  reason: string | null;
  totalDays: number;
  presentDays: number;
  percentage: number | null;
}

export interface DiaryPage<Row, Summary> {
  date: string;
  page: number;
  pageSize: number;
  total: number;
  summary: Summary;
  items: Row[];
}

export interface StudentSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  notMarked: number;
  averagePercentage: number | null;
  below75: number;
}
export interface EmployeeSummary {
  total: number;
  present: number;
  absent: number;
  onDuty: number;
  onLeave: number;
  notMarked: number;
  averagePercentage: number | null;
}

// ---- query shapes (kept in sync with the backend DTOs; anything else is dropped) ----
export interface StudentDiaryParams {
  date?: string;
  q?: string;
  gradeIds?: string[];
  sectionIds?: string[];
  dayStatus?: string;
  percentBand?: string;
  residence?: string;
  transport?: string;
  gender?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}
export interface EmployeeDiaryParams {
  date?: string;
  q?: string;
  group?: string;
  dayStatus?: string;
  percentBand?: string;
  departmentId?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

async function request<T>(path: string, query: Record<string, string | number | undefined>): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  const res = await apiFetch(`/attendance-diary/${path}${qs.size ? `?${qs}` : ""}`, { cache: "no-store" });
  if (res.status === 403) throw new Error("You don't have access to this view.");
  const body = await parseApiResponse<{ data: T }>(res);
  return body.data;
}

export const getDiaryContext = (date?: string) => request<DiaryContext>("context", { date });

export interface DiaryStudentProfile {
  date: string;
  student: {
    studentId: string;
    firstName: string;
    lastName: string | null;
    admissionNo: string;
    rollNo: number | null;
    gender: string | null;
    sectionId: string;
    sectionName: string;
    gradeId: string;
    gradeName: string;
    isHosteller: boolean;
    usesSchoolTransport: boolean;
  };
  dayStatus: string;
  summary: { totalDays: number; presentDays: number; lateDays: number; absentDays: number; percentage: number | null };
  monthly: { month: string; total: number; present: number; absent: number; late: number }[];
  recent: { date: string; status: string; reason: string | null; markedAt: string | null }[];
}

export const getDiaryStudentProfile = (studentId: string, date?: string) =>
  request<DiaryStudentProfile>(`students/${encodeURIComponent(studentId)}`, { date });

export const listDiaryStudents = (p: StudentDiaryParams) =>
  request<DiaryPage<DiaryStudentRow, StudentSummary>>("students", {
    date: p.date,
    q: p.q,
    gradeIds: p.gradeIds?.join(","),
    sectionIds: p.sectionIds?.join(","),
    dayStatus: p.dayStatus,
    percentBand: p.percentBand,
    residence: p.residence,
    transport: p.transport,
    gender: p.gender,
    sort: p.sort,
    page: p.page,
    pageSize: p.pageSize,
  });

export const listDiaryEmployees = (p: EmployeeDiaryParams) =>
  request<DiaryPage<DiaryEmployeeRow, EmployeeSummary>>("employees", {
    date: p.date,
    q: p.q,
    group: p.group,
    dayStatus: p.dayStatus,
    percentBand: p.percentBand,
    departmentId: p.departmentId,
    sort: p.sort,
    page: p.page,
    pageSize: p.pageSize,
  });
