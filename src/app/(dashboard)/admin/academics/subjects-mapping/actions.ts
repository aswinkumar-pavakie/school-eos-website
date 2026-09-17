"use server";

// Server actions for the Admin "Subjects & mapping" page. Deliberately its own
// file (not an addition to admin/academics/actions.ts) so this build never
// touches a file a sibling in-progress pass (the AcademicsTabs/SubjectsPanel
// polish work happening in parallel this session) might also be editing --
// every action below calls the SAME real backend endpoints that
// admin/academics/actions.ts and its panels already use (POST /subjects,
// PATCH /subject-offerings/:id/teacher, POST /role-assignments,
// POST /role-assignments/:id/revoke), just from a route of its own.

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export interface FormActionState {
  error?: string;
  success?: string;
}

const PATH = "/admin/academics/subjects-mapping";

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? "Something went wrong. Nothing was changed.";
}

// "Define a subject" panel -- real POST /subjects (same endpoint SubjectsPanel's
// own createSubjectAction calls). PERIODS/WEEK and CO-ORDINATOR are real inputs
// shown in the panel per the reference layout, but subject has no periods_per_week
// or coordinator column of its own (periods/week lives per subject_offering row,
// per class; a coordinator is assigned per grade band via role_assignment, not
// per subject) -- so only name/code/subjectType/appliesToStage are ever sent;
// the form marks the other two fields informational, never silently dropped.
export async function createSubjectAction(_prev: FormActionState, formData: FormData): Promise<FormActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const subjectType = String(formData.get("subjectType") ?? "").trim();
  const appliesToStage = String(formData.get("appliesToStage") ?? "").trim();

  if (!name || !code || !subjectType) {
    return { error: "Subject code, name and type are required." };
  }

  const payload: Record<string, unknown> = { name, code, subjectType };
  if (appliesToStage) payload.appliesToStage = appliesToStage;

  const res = await apiFetch("/subjects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(PATH);
  return { success: "Subject created." };
}

// "Assign a teacher to a class" -- reuses the real PATCH /subject-offerings/:id/teacher
// endpoint (subject-offerings.controller.ts). Only works against an EXISTING
// subject_offering row for that section+subject (the real schema has no create
// endpoint for a brand-new offering -- see query.md's own note under this
// page's heading), so the caller passes the offering id it already resolved
// client-side from the real /subject-offerings/all data.
export async function assignOfferingTeacherAction(
  offeringId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const teacherStaffId = String(formData.get("teacherStaffId") ?? "").trim();
  if (!teacherStaffId) return { error: "Choose a teacher." };

  const res = await apiFetch(`/subject-offerings/${offeringId}/teacher`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teacherStaffId }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(PATH);
  return { success: "Teacher assigned." };
}

// "Assign teacher" with ROLE = Class teacher / Advisor -- the real per-section
// role, granted via role_assignment (role_code=CLASS_ADVISOR, scope_type=SECTION),
// exactly the same action ClassAdvisorsPanel.tsx's own assignClassAdvisorAction
// performs (revoke the section's current advisor first, then grant). Kept as
// its own copy here (not an import from admin/academics/actions.ts) for the
// same file-isolation reason as the header comment above.
export async function assignClassTeacherAction(
  sectionId: string,
  currentAssignmentId: string | undefined,
  academicYearId: string,
  personId: string,
): Promise<FormActionState> {
  if (currentAssignmentId) {
    const revokeRes = await apiFetch(`/role-assignments/${currentAssignmentId}/revoke`, { method: "POST" });
    if (!revokeRes.ok) return { error: await readError(revokeRes) };
  }
  const res = await apiFetch("/role-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personId, roleCode: "CLASS_ADVISOR", scopeType: "SECTION", scopeId: sectionId, academicYearId }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(PATH);
  revalidatePath("/admin/academics");
  return { success: "Class teacher assigned." };
}

// Academic co-ordinators section -- "Edit" on a band card. Real POST
// /role-assignments (scope_type=STAGE), revoking the previous holder for that
// exact stage first -- same fix admin/academics/actions.ts's own
// assignCoordinatorAction already applies (a stale second holder is a real bug
// class, not hypothetical -- see that file's own comment).
export async function assignBandCoordinatorAction(
  academicYearId: string,
  scopeStage: string,
  currentAssignmentId: string | undefined,
  personId: string,
): Promise<FormActionState> {
  if (!personId) return { error: "Choose a co-ordinator." };
  if (currentAssignmentId) {
    const revokeRes = await apiFetch(`/role-assignments/${currentAssignmentId}/revoke`, { method: "POST" });
    if (!revokeRes.ok) return { error: await readError(revokeRes) };
  }
  const res = await apiFetch("/role-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ personId, roleCode: "ACADEMIC_COORDINATOR", scopeType: "STAGE", scopeStage, academicYearId }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(PATH);
  revalidatePath("/admin/academics");
  return { success: "Co-ordinator assigned." };
}
