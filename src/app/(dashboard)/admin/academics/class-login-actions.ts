"use server";

// Admin actions for the constant class logins (one permanent login per class).
// Backend: school-eos-backend/src/modules/admin/class-teacher-login.controller.ts.
// Passwords only ever travel back through the two actions that must show one
// (change/reset returns the new one once; reveal is a separate audited call).

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import type { ClassLoginStudent, ClassLoginHistoryItem, RolloverPreview, RolloverResult } from "@/lib/class-login-types";

export type ActionResult<T = object> = { error?: string } & Partial<T>;

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? "Something went wrong. Nothing was changed.";
}

async function post<T>(path: string, payload?: unknown): Promise<ActionResult<{ data: T }>> {
  const res = await apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
  if (!res.ok) return { error: await readError(res) };
  const body = (await res.json().catch(() => ({}))) as { data: T };
  return { data: body.data };
}

async function get<T>(path: string): Promise<ActionResult<{ data: T }>> {
  const res = await apiFetch(path);
  if (!res.ok) return { error: await readError(res) };
  const body = (await res.json()) as { data: T };
  return { data: body.data };
}

function refresh() {
  revalidatePath("/admin/academics");
  revalidatePath("/admin/faculty");
}

export async function changeClassTeacherAction(
  loginPersonId: string,
  sectionId: string,
  facultyPersonId: string,
  rotatePassword: boolean,
): Promise<ActionResult<{ newPassword: string | null }>> {
  if (!facultyPersonId) return { error: "Choose a faculty member first." };
  const r = await post<{ reassigned: true; newPassword?: string }>(`/class-teacher-logins/${loginPersonId}/reassign`, {
    sectionId,
    facultyPersonId,
    rotatePassword,
  });
  if (r.error) return { error: r.error };
  refresh();
  return { newPassword: r.data?.newPassword ?? null };
}

export async function vacateClassLoginAction(loginPersonId: string): Promise<ActionResult<{ newPassword: null }>> {
  const r = await post<{ vacated: true }>(`/class-teacher-logins/${loginPersonId}/vacate`);
  if (r.error) return { error: r.error };
  refresh();
  return { newPassword: null };
}

export async function setClassLoginPasswordAction(
  loginPersonId: string,
  newPassword?: string,
): Promise<ActionResult<{ newPassword: string }>> {
  const body = newPassword && newPassword.trim() ? { newPassword: newPassword.trim() } : {};
  const r = await post<{ newPassword: string }>(`/class-teacher-logins/${loginPersonId}/password`, body);
  if (r.error) return { error: r.error };
  refresh();
  return { newPassword: r.data!.newPassword };
}

export async function revealClassLoginPasswordAction(loginPersonId: string): Promise<ActionResult<{ password: string }>> {
  const r = await post<{ password: string }>(`/class-teacher-logins/${loginPersonId}/reveal-password`);
  if (r.error) return { error: r.error };
  return { password: r.data!.password };
}

export async function revokeClassLoginLinksAction(loginPersonId: string): Promise<ActionResult<{ revoked: number }>> {
  const r = await post<{ revoked: number }>(`/class-teacher-logins/${loginPersonId}/revoke-links`);
  if (r.error) return { error: r.error };
  refresh();
  return { revoked: r.data?.revoked ?? 0 };
}

export async function classLoginStudentsAction(
  loginPersonId: string,
  academicYearId?: string,
): Promise<ActionResult<{ students: ClassLoginStudent[] }>> {
  const qs = academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : "";
  const r = await get<{ students: ClassLoginStudent[] }>(`/class-teacher-logins/${loginPersonId}/students${qs}`);
  if (r.error) return { error: r.error };
  return { students: r.data!.students };
}

export async function classLoginHistoryAction(
  loginPersonId: string,
): Promise<ActionResult<{ history: ClassLoginHistoryItem[] }>> {
  const r = await get<{ history: ClassLoginHistoryItem[] }>(`/class-teacher-logins/${loginPersonId}/history`);
  if (r.error) return { error: r.error };
  return { history: r.data!.history };
}

export async function rolloverPreviewAction(targetAcademicYearId: string): Promise<ActionResult<{ preview: RolloverPreview }>> {
  const r = await post<RolloverPreview>(`/class-teacher-logins/rollover/preview`, { targetAcademicYearId });
  if (r.error) return { error: r.error };
  return { preview: r.data! };
}

export async function rolloverApplyAction(
  targetAcademicYearId: string,
  rotatePasswords: boolean,
): Promise<ActionResult<{ result: RolloverResult }>> {
  const r = await post<RolloverResult>(`/class-teacher-logins/rollover/apply`, { targetAcademicYearId, rotatePasswords });
  if (r.error) return { error: r.error };
  refresh();
  return { result: r.data! };
}
