"use server";

// Server Actions the Attendance Diary UI calls when a filter / date / page changes. Inputs are
// re-validated here (whitelist + shape) before being forwarded -- defense in depth only: the
// backend independently validates every parameter and enforces the caller's scope.

import {
  getDiaryContext,
  listDiaryEmployees,
  listDiaryStudents,
  type DiaryContext,
  type DiaryEmployeeRow,
  type DiaryPage,
  type DiaryStudentRow,
  type EmployeeDiaryParams,
  type EmployeeSummary,
  type StudentDiaryParams,
  type StudentSummary,
} from "./attendance-diary-api";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const pickOne = (v: unknown, allowed: readonly string[]): string | undefined =>
  typeof v === "string" && allowed.includes(v) ? v : undefined;
const uuids = (v: unknown, max: number): string[] | undefined =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && UUID_RE.test(x)).slice(0, max) : undefined;
const intIn = (v: unknown, min: number, max: number): number | undefined =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : undefined;
const date = (v: unknown): string | undefined => (typeof v === "string" && DATE_RE.test(v) ? v : undefined);
const text = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim().slice(0, 60) : undefined);

const BANDS = ["LT60", "LT75", "BETWEEN_75_90", "GTE90"] as const;

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }
}

export async function diaryContextAction(input: { date?: string }): Promise<ActionResult<DiaryContext>> {
  return run(() => getDiaryContext(date(input?.date)));
}

export async function diaryStudentsAction(
  input: StudentDiaryParams,
): Promise<ActionResult<DiaryPage<DiaryStudentRow, StudentSummary>>> {
  const i = (input ?? {}) as Record<string, unknown>;
  return run(() =>
    listDiaryStudents({
      date: date(i.date),
      q: text(i.q),
      gradeIds: uuids(i.gradeIds, 20),
      sectionIds: uuids(i.sectionIds, 80),
      dayStatus: pickOne(i.dayStatus, ["PRESENT", "ABSENT", "LATE", "NOT_MARKED"]),
      percentBand: pickOne(i.percentBand, BANDS),
      residence: pickOne(i.residence, ["HOSTEL", "DAY_SCHOLAR"]),
      transport: pickOne(i.transport, ["BUS", "NO_BUS"]),
      gender: pickOne(i.gender, ["MALE", "FEMALE"]),
      sort: pickOne(i.sort, ["NAME", "CLASS", "PERCENT_ASC", "PERCENT_DESC"]),
      page: intIn(i.page, 1, 100000),
      pageSize: intIn(i.pageSize, 1, 100),
    }),
  );
}

export async function diaryEmployeesAction(
  input: EmployeeDiaryParams,
): Promise<ActionResult<DiaryPage<DiaryEmployeeRow, EmployeeSummary>>> {
  const i = (input ?? {}) as Record<string, unknown>;
  return run(() =>
    listDiaryEmployees({
      date: date(i.date),
      q: text(i.q),
      group: pickOne(i.group, ["PRINCIPAL", "VICE_PRINCIPAL", "FACULTY"]),
      dayStatus: pickOne(i.dayStatus, ["PRESENT", "ABSENT", "ON_DUTY", "ON_LEAVE", "NOT_MARKED"]),
      percentBand: pickOne(i.percentBand, BANDS),
      departmentId: typeof i.departmentId === "string" && UUID_RE.test(i.departmentId) ? i.departmentId : undefined,
      sort: pickOne(i.sort, ["NAME", "PERCENT_ASC", "PERCENT_DESC"]),
      page: intIn(i.page, 1, 100000),
      pageSize: intIn(i.pageSize, 1, 100),
    }),
  );
}
