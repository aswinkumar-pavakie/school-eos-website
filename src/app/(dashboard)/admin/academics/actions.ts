"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface FormActionState {
  error?: string;
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? "Something went wrong. Nothing was changed.";
}

function collect(formData: FormData, keys: string[]): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") payload[key] = value;
  }
  return payload;
}

async function runMutation(
  path: string,
  method: "POST" | "PATCH",
  payload: Record<string, unknown>,
): Promise<FormActionState> {
  const res = await apiFetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/academics");
  return {};
}

// Academic years
export async function createAcademicYearAction(_prev: FormActionState, formData: FormData) {
  return runMutation("/academic-years", "POST", collect(formData, ["name", "startDate", "endDate"]));
}
export async function setCurrentAcademicYearAction(id: string): Promise<void> {
  await apiFetch(`/academic-years/${id}/set-current`, { method: "POST" });
  revalidatePath("/admin/academics");
}
export async function closeAcademicYearAction(id: string): Promise<void> {
  await apiFetch(`/academic-years/${id}/close`, { method: "POST" });
  revalidatePath("/admin/academics");
}

// Grades
export async function createGradeAction(_prev: FormActionState, formData: FormData) {
  return runMutation("/grades", "POST", collect(formData, ["name", "levelNo", "stage"]));
}
export async function updateGradeAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/grades/${id}`, "PATCH", collect(formData, ["name", "levelNo", "stage", "status"]));
}

// Sections
export async function createSectionAction(_prev: FormActionState, formData: FormData) {
  return runMutation(
    "/sections",
    "POST",
    collect(formData, ["academicYearId", "gradeId", "mediumId", "name", "capacity"]),
  );
}
export async function updateSectionAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/sections/${id}`, "PATCH", collect(formData, ["name", "capacity", "status"]));
}

// Subjects
export async function createSubjectAction(_prev: FormActionState, formData: FormData) {
  return runMutation("/subjects", "POST", collect(formData, ["name", "code", "subjectType", "appliesToStage"]));
}
export async function updateSubjectAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(
    `/subjects/${id}`,
    "PATCH",
    collect(formData, ["name", "code", "subjectType", "appliesToStage", "status"]),
  );
}

// Departments
export async function createDepartmentAction(_prev: FormActionState, formData: FormData) {
  return runMutation("/departments", "POST", collect(formData, ["name", "code"]));
}
export async function updateDepartmentAction(id: string, _prev: FormActionState, formData: FormData) {
  return runMutation(`/departments/${id}`, "PATCH", collect(formData, ["name", "code", "status"]));
}

// Class Advisor / Academic Coordinator / Sports Faculty -- these are real login
// roles (role_assignment.role_code), the same system every other role in this app
// uses (see query.md for how a first draft nearly duplicated this into a new
// table before catching that 56 real CLASS_ADVISOR assignments already existed).
export async function assignClassAdvisorAction(
  sectionId: string,
  currentAssignmentId: string | undefined,
  academicYearId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  if (currentAssignmentId) {
    const revokeRes = await apiFetch(`/role-assignments/${currentAssignmentId}/revoke`, { method: "POST" });
    if (!revokeRes.ok) return { error: await readError(revokeRes) };
  }

  const res = await apiFetch("/role-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personId: formData.get("personId"),
      roleCode: "CLASS_ADVISOR",
      scopeType: "SECTION",
      scopeId: sectionId,
      academicYearId,
    }),
  });

  if (!res.ok) return { error: await readError(res) };
  revalidatePath("/admin/academics");
  return {};
}

export async function endStaffRoleAssignmentAction(id: string): Promise<void> {
  await apiFetch(`/role-assignments/${id}/revoke`, { method: "POST" });
  revalidatePath("/admin/academics");
  revalidatePath("/admin/faculty");
}

/**
 * Reassigning Academic Coordinator/Sports Faculty for a standard or stage that
 * already has a DIFFERENT active holder used to just add a second active
 * assignment alongside the first -- unlike assignClassAdvisorAction above,
 * which already revokes the section's current advisor before granting the
 * new one, this action never checked for an existing holder at all. The DB
 * only blocks the exact same person+role+scope being granted twice
 * (uq_role_assignment_active) -- two DIFFERENT people both holding
 * "Academic Coordinator, Standard 5" at once is not blocked by any
 * constraint, so a stale-old-holder bug here was real, not hypothetical.
 *
 * Fixed the same way Class Advisor already works: for each target scope,
 * look up who (if anyone) currently holds this exact role there and revoke
 * that assignment first -- so the role, and whatever it unlocks for that
 * person's own login, moves cleanly from the old coordinator to the new one
 * instead of both being active simultaneously. Re-selecting a scope the same
 * person already covers is a no-op (skipped, not re-granted, since granting
 * it again would just hit the same unique-violation the DB already guards).
 */
export async function assignCoordinatorAction(
  academicYearId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const personId = formData.get("personId");
  const roleCode = formData.get("roleCode");
  const scopeKind = formData.get("scopeKind");
  const gradeIds = formData.getAll("gradeIds").filter((v): v is string => typeof v === "string" && v !== "");
  const scopeStages = formData.getAll("scopeStages").filter((v): v is string => typeof v === "string" && v !== "");

  const targets: { scopeType: string; scopeId?: string; scopeStage?: string }[] =
    scopeKind === "STAGE"
      ? scopeStages.map((scopeStage) => ({ scopeType: "STAGE", scopeStage }))
      : gradeIds.map((scopeId) => ({ scopeType: "GRADE", scopeId }));

  if (targets.length === 0) {
    return { error: scopeKind === "STAGE" ? "Select at least one stage." : "Select at least one standard." };
  }
  if (typeof roleCode !== "string" || typeof personId !== "string") {
    return { error: "Missing role or staff selection." };
  }

  const existingRes = await apiFetch(`/role-assignments?roleCode=${roleCode}&status=ACTIVE`);
  const existing: { id: string; personId: string; scopeType: string; scopeId: string | null; scopeStage: string | null }[] =
    existingRes.ok ? (await existingRes.json()).data : [];

  for (const target of targets) {
    const holder = existing.find(
      (a) =>
        a.scopeType === target.scopeType &&
        (target.scopeType === "GRADE" ? a.scopeId === target.scopeId : a.scopeStage === target.scopeStage),
    );

    if (holder && holder.personId === personId) {
      // Already correctly assigned to this exact person -- nothing to do.
      continue;
    }

    if (holder) {
      const revokeRes = await apiFetch(`/role-assignments/${holder.id}/revoke`, { method: "POST" });
      if (!revokeRes.ok) return { error: await readError(revokeRes) };
    }

    const res = await apiFetch("/role-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        roleCode,
        academicYearId,
        ...target,
      }),
    });
    if (!res.ok) return { error: await readError(res) };
  }

  revalidatePath("/admin/academics");
  revalidatePath("/admin/faculty");
  return {};
}
