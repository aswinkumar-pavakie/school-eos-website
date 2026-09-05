"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface FormActionState {
  error?: string;
  temporaryPassword?: string;
  personId?: string;
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? "Something went wrong. Nothing was changed.";
}

/**
 * A parent is just a person holding a PARENT role assignment -- no subtype table,
 * so (unlike Faculty) this is a single call to the existing POST /persons. Linking
 * this new parent to a student happens separately, from the student's own profile.
 *
 * The generated temporary password is returned in the action's own state and shown
 * once in the modal's confirmation view -- never put in a URL (redirect query
 * param, etc.), since that would leak it into browser history, server access logs,
 * and the Referer header.
 */
export async function createParentAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch("/persons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName") || undefined,
      gender: formData.get("gender") || undefined,
      identifierType: formData.get("identifierType"),
      identifierValue: formData.get("identifierValue"),
      initialRole: { roleCode: "PARENT", scopeType: "SCHOOL" },
    }),
  });

  if (!res.ok) {
    return { error: await readError(res) };
  }

  const { data } = (await res.json()) as {
    data: { person: { id: string }; temporaryPassword: string };
  };

  revalidatePath("/admin/parents");
  return { temporaryPassword: data.temporaryPassword, personId: data.person.id };
}

export async function activateParentAction(personId: string): Promise<void> {
  const res = await apiFetch(`/persons/${personId}/activate`, { method: "POST" });
  if (!res.ok) throw new Error(await readError(res));
  revalidatePath("/admin/parents");
  revalidatePath(`/admin/parents/${personId}`);
}

export async function deactivateParentAction(personId: string): Promise<void> {
  const res = await apiFetch(`/persons/${personId}/deactivate`, { method: "POST" });
  if (!res.ok) throw new Error(await readError(res));
  revalidatePath("/admin/parents");
  revalidatePath(`/admin/parents/${personId}`);
}

export async function updateParentContactAction(
  personId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/persons/${personId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mobile: formData.get("mobile") || undefined,
      email: formData.get("email") || undefined,
    }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/parents/${personId}`);
  return {};
}

export interface ResetPasswordState {
  error?: string;
  temporaryPassword?: string;
}

/**
 * Only meaningful once resetAllowanceUsed is true (the parent has already used
 * their one self-service reset) -- the frontend gates showing this action on
 * that flag, matching the explicit rule: admin only resets credentials once a
 * parent has forgotten their password more than once. The temporary password
 * is returned in this action's own state and shown once, never put in a URL
 * (same lesson as the initial temp password on account creation).
 */
export async function resetParentPasswordAction(personId: string): Promise<ResetPasswordState> {
  const res = await apiFetch(`/persons/${personId}/password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) return { error: await readError(res) };
  const { data } = (await res.json()) as { data: { newPassword: string } };
  revalidatePath(`/admin/parents/${personId}`);
  return { temporaryPassword: data.newPassword };
}

export interface QuickCreateStudentState {
  error?: string;
  studentId?: string;
  studentName?: string;
}

/**
 * Quick-create a student (just the required fields, not the full admission
 * form) and link them to a parent in one step -- for "create the student right
 * here while creating/viewing the parent" rather than switching to Students,
 * creating the child, then coming back to link. Unlike createStudentAction
 * (students/actions.ts), this never redirects -- it's meant to be called
 * repeatedly, once per child, without leaving the parent's own page.
 */
export async function quickCreateStudentAndLinkAction(
  parentPersonId: string,
  _prev: QuickCreateStudentState,
  formData: FormData,
): Promise<QuickCreateStudentState> {
  const firstName = formData.get("firstName");
  const admissionNo = formData.get("admissionNo");
  const admissionDate = formData.get("admissionDate");
  const mobile = formData.get("mobile");
  const email = formData.get("email");
  const relationship = formData.get("relationship");

  if (!mobile && !email) {
    return { error: "At least one of mobile or email is required for the student." };
  }

  const studentRes = await apiFetch("/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName,
      lastName: formData.get("lastName") || undefined,
      admissionNo,
      admissionDate,
      mobile: mobile || undefined,
      email: email || undefined,
    }),
  });

  if (!studentRes.ok) return { error: await readError(studentRes) };
  const { data: student } = (await studentRes.json()) as { data: { id: string; firstName: string; lastName: string | null } };

  const guardianRes = await apiFetch(`/students/${student.id}/guardians`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personId: parentPersonId, relationship }),
  });

  if (!guardianRes.ok) {
    return {
      error: `Student was created (admission no. ${admissionNo}), but linking to this parent failed: ${await readError(guardianRes)}. Link them manually from the student's profile.`,
      studentId: student.id,
    };
  }

  revalidatePath("/admin/students");
  revalidatePath(`/admin/parents/${parentPersonId}`);
  return { studentId: student.id, studentName: `${student.firstName} ${student.lastName ?? ""}`.trim() };
}

export async function updateGuardianOccupationAction(
  guardianLinkId: string,
  personId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const res = await apiFetch(`/guardian-links/${guardianLinkId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ occupation: formData.get("occupation") || undefined }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/parents/${personId}`);
  return {};
}
