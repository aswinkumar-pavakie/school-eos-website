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

export interface ResetPasswordState {
  error?: string;
  temporaryPassword?: string;
}

/**
 * Same real POST /persons/:id/password-reset every role's admin reset already
 * goes through (see admin/parents/actions.ts's own resetParentPasswordAction)
 * -- ADMIN-only, role-agnostic on the backend. Faculty's own profile gates
 * showing this the same way Parent's does: only once resetAllowanceUsed is
 * true (the faculty member already used their one self-service reset via
 * the public /auth/password-reset/* flow, itself unrelated to and unchanged
 * by this action).
 *
 * Two different ids on purpose: the reset itself targets personId (the
 * person/login row -- staff.id is a different row entirely), but this page's
 * own URL is keyed by staffId (/admin/faculty/[id] fetches GET /staff/:id),
 * so that's what needs revalidating, not personId.
 */
export async function resetFacultyPasswordAction(staffId: string, personId: string): Promise<ResetPasswordState> {
  const res = await apiFetch(`/persons/${personId}/password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) return { error: await readError(res) };
  const { data } = (await res.json()) as { data: { newPassword: string } };
  revalidatePath(`/admin/faculty/${staffId}`);
  return { temporaryPassword: data.newPassword };
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
  const experienceYears = formData.get("experienceYears");
  if (typeof experienceYears === "string" && experienceYears.trim() !== "") {
    staffPayload.experienceYears = Number(experienceYears);
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

  // Extra responsibility role (optional) -- same real role_assignment system
  // admin/academics/actions.ts's assignCoordinatorAction/assignClassAdvisorAction
  // already use, reused here (not duplicated as a second engine) so a brand-new
  // hire can be given Academic Coordinator / Sports Faculty / Class Advisor at
  // creation time instead of a separate trip to Academics afterward. If the
  // chosen scope already has a different active holder, that holder is
  // revoked first -- the same one-active-holder-per-scope fix applied to
  // assignCoordinatorAction, so this can't silently create a second active
  // coordinator for the same standard/stage/section.
  const extraRole = formData.get("extraRole");
  if (typeof extraRole === "string" && extraRole.trim() !== "") {
    const target =
      extraRole === "CLASS_ADVISOR"
        ? (() => {
            const sectionId = formData.get("extraRoleSectionId");
            return typeof sectionId === "string" && sectionId.trim() !== ""
              ? { scopeType: "SECTION", scopeId: sectionId }
              : null;
          })()
        : (() => {
            const gradeId = formData.get("extraRoleScopeGradeId");
            const scopeStage = formData.get("extraRoleScopeStage");
            if (typeof gradeId === "string" && gradeId.trim() !== "") return { scopeType: "GRADE", scopeId: gradeId };
            if (typeof scopeStage === "string" && scopeStage.trim() !== "") return { scopeType: "STAGE", scopeStage };
            return null;
          })();

    if (!target) {
      return {
        error: `Faculty account was created, but no scope was selected for the extra role — assign it from the profile's Roles section instead.`,
        temporaryPassword,
        personId,
        staffId: staff.id,
      };
    }

    const yearRes = await apiFetch("/academic-years");
    const currentYear = yearRes.ok
      ? ((await yearRes.json()) as { data: { id: string; isCurrent: boolean }[] }).data.find((y) => y.isCurrent)
      : undefined;

    const existingRes = await apiFetch(`/role-assignments?roleCode=${extraRole}&status=ACTIVE`);
    const existing: { id: string; personId: string; scopeType: string; scopeId: string | null; scopeStage: string | null }[] =
      existingRes.ok ? (await existingRes.json()).data : [];
    const holder = existing.find(
      (a) =>
        a.scopeType === target.scopeType &&
        ("scopeStage" in target
          ? a.scopeStage === target.scopeStage
          : a.scopeId === target.scopeId),
    );

    if (holder) {
      const revokeRes = await apiFetch(`/role-assignments/${holder.id}/revoke`, { method: "POST" });
      if (!revokeRes.ok) {
        return {
          error: `Faculty account was created, but the previous holder of this role/scope couldn't be revoked: ${await readError(revokeRes)}. Reassign it from Academics instead.`,
          temporaryPassword,
          personId,
          staffId: staff.id,
        };
      }
    }

    const roleRes = await apiFetch("/role-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        roleCode: extraRole,
        academicYearId: currentYear?.id,
        ...target,
      }),
    });
    if (!roleRes.ok) {
      return {
        error: `Faculty account was created, but the extra role couldn't be assigned: ${await readError(roleRes)}. Assign it from the profile's Roles section instead.`,
        temporaryPassword,
        personId,
        staffId: staff.id,
      };
    }
    revalidatePath("/admin/academics");
  }

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
  const experienceYears = formData.get("experienceYears");
  if (typeof experienceYears === "string" && experienceYears.trim() !== "") {
    staffPayload.experienceYears = Number(experienceYears);
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

export interface SectionSubjectOffering {
  id: string;
  sectionId: string;
  gradeName: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  teacherStaffId: string | null;
  teacherFirstName: string | null;
  teacherLastName: string | null;
}

/** A plain data lookup (not a mutation) -- called directly from the client
 * component when a grade/section is picked in "Assign a subject", the same
 * way a client component can call any "use server" function and await its
 * return value. */
export async function listSectionSubjectOfferingsAction(
  sectionId: string,
): Promise<{ data: SectionSubjectOffering[] } | { error: string }> {
  const res = await apiFetch(`/subject-offerings?sectionId=${sectionId}`);
  if (!res.ok) return { error: await readError(res) };
  return { data: (await res.json()).data };
}

export interface AssignSubjectTeacherState {
  error?: string;
  success?: boolean;
}

/** Reassigns a subject_offering's teacher to this faculty member -- the real,
 * already-populated teaching-assignment table (subject_offering.teacher_staff_id),
 * not a new concept. Every offering already has a teacher, so this always
 * takes over from whoever currently holds it -- the UI shows who that is
 * before the admin confirms. */
export async function assignSubjectTeacherAction(
  offeringId: string,
  staffId: string,
  facultyDetailPath: string,
): Promise<AssignSubjectTeacherState> {
  const res = await apiFetch(`/subject-offerings/${offeringId}/teacher`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teacherStaffId: staffId }),
  });
  if (!res.ok) return { error: await readError(res) };

  revalidatePath(facultyDetailPath);
  return { success: true };
}
