"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface FormActionState {
  error?: string;
  temporaryPassword?: string;
  personId?: string;
  staffId?: string;
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? "Something went wrong. Nothing was changed.";
}

/**
 * Faculty is a real mobile login role, unlike Students -- creating one is a genuine
 * two-step orchestration: POST /persons (person + login + FACULTY role assignment),
 * then POST /staff (the employment subtype) against the resulting personId. If step
 * 2 fails, the person already exists -- we say so explicitly rather than losing
 * track of it, since there's no automatic rollback across the two calls.
 */
export async function createFacultyAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const identifierType = formData.get("identifierType");
  const identifierValue = formData.get("identifierValue");

  const personRes = await apiFetch("/persons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName") || undefined,
      gender: formData.get("gender") || undefined,
      addressLine1: formData.get("addressLine1") || undefined,
      addressLine2: formData.get("addressLine2") || undefined,
      city: formData.get("city") || undefined,
      state: formData.get("state") || undefined,
      pincode: formData.get("pincode") || undefined,
      identifierType,
      identifierValue,
      initialRole: { roleCode: "FACULTY", scopeType: "SCHOOL" },
    }),
  });

  if (!personRes.ok) {
    return { error: await readError(personRes) };
  }

  const { data: personResult } = (await personRes.json()) as {
    data: { person: { id: string }; temporaryPassword: string };
  };
  const personId = personResult.person.id;
  const temporaryPassword = personResult.temporaryPassword;

  const staffPayload: Record<string, unknown> = {
    personId,
    employeeNo: formData.get("employeeNo"),
    dateOfJoining: formData.get("dateOfJoining"),
    isTeaching: formData.get("isTeaching") === "on",
  };
  for (const key of ["designation", "teacherCategory", "postType", "stateTeacherId"]) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") staffPayload[key] = value;
  }

  const staffRes = await apiFetch("/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staffPayload),
  });

  if (!staffRes.ok) {
    // The person (with login) was created successfully -- don't let that fact get
    // lost just because the employment details failed to attach.
    return {
      error: `Faculty account was created (temporary password: ${temporaryPassword}), but the employment details couldn't be saved: ${await readError(staffRes)}. Person ID ${personId} — add the staff record for them from an edit screen once available, or contact engineering.`,
      temporaryPassword,
      personId,
    };
  }

  const { data: staff } = (await staffRes.json()) as { data: { id: string } };
  revalidatePath("/admin/faculty");
  // Not a redirect: a temporary password must never travel through a URL (browser
  // history, server access logs, and the Referer header would all capture it).
  // Returned here instead, shown once in the modal's own confirmation state, and
  // never persisted anywhere after that.
  return { temporaryPassword, personId, staffId: staff.id };
}

/** Employment details (staff) and address (person) are two different backend
 * resources, but the profile shows them as one "Save changes" action with a
 * single button -- both PATCHes fire from this one action so the admin never
 * has to remember there were ever two separate saves. */
export async function updateFacultyProfileAction(
  staffId: string,
  personId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const staffPayload: Record<string, unknown> = {
    isTeaching: formData.get("isTeaching") === "on",
  };
  for (const key of ["employeeNo", "designation", "teacherCategory", "postType", "stateTeacherId"]) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") staffPayload[key] = value;
  }

  const addressPayload: Record<string, unknown> = {};
  for (const key of ["addressLine1", "addressLine2", "city", "state", "pincode"]) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") addressPayload[key] = value;
  }

  const [staffRes, addressRes] = await Promise.all([
    apiFetch(`/staff/${staffId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staffPayload),
    }),
    apiFetch(`/persons/${personId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressPayload),
    }),
  ]);

  const errors: string[] = [];
  if (!staffRes.ok) errors.push(await readError(staffRes));
  if (!addressRes.ok) errors.push(await readError(addressRes));
  if (errors.length > 0) return { error: errors.join(" ") };

  revalidatePath(`/admin/faculty/${staffId}`);
  revalidatePath("/admin/faculty");
  return {};
}

export async function exitStaffAction(
  staffId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const exitReason = formData.get("exitReason");
  const dateOfExit = formData.get("dateOfExit");
  const payload: Record<string, unknown> = { exitReason };
  if (typeof dateOfExit === "string" && dateOfExit.trim() !== "") {
    payload.dateOfExit = dateOfExit;
  }

  const res = await apiFetch(`/staff/${staffId}/exit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { error: await readError(res) };
  }

  revalidatePath(`/admin/faculty/${staffId}`);
  revalidatePath("/admin/faculty");
  return {};
}

/** Address lives on `person`, not `staff` -- PATCHes /persons/:id (same
 * endpoint EditParentContactForm uses for mobile/email), scoped to just the
 * address fields here. */
