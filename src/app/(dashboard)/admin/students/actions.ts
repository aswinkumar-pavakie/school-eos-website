"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { parseApiError } from "@/lib/form-errors";

export interface FormActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  studentId?: string;
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (Array.isArray(body?.message)) return body.message.join(" ");
  return body?.message ?? "Something went wrong. Nothing was changed.";
}

/** Suggests the next admission_no (see students.service.ts's own
 * getNextAdmissionNo -- SMS<year><4-digit seq>, incrementing the highest
 * sequence already used for the current year). A suggestion only -- the
 * Admin still sees it in the field and can edit it before submitting. Fails
 * soft (empty string) so a transient error here never blocks the form. */
export async function getNextAdmissionNoAction(): Promise<string> {
  const res = await apiFetch("/students/next-admission-no");
  if (!res.ok) return "";
  const { data } = (await res.json()) as { data: { admissionNo: string } };
  return data.admissionNo;
}

export async function createStudentAction(
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  // Class is a required field on this form (CreateStudentModal's own
  // SelectField `required` attribute) -- checked again here since a server
  // action can be invoked directly and must not trust client-side HTML
  // validation alone. Failing fast, before the student record is even
  // created, matches the "every admission gets a class" requirement --
  // previously this was optional ("Assign later") and the student POST
  // happened regardless.
  const sectionId = formData.get("sectionId");
  if (typeof sectionId !== "string" || sectionId.trim() === "") {
    return { fieldErrors: { sectionId: "Class is required." } };
  }

  const payload: Record<string, unknown> = {
    firstName: formData.get("firstName"),
    admissionNo: formData.get("admissionNo"),
    admissionDate: formData.get("admissionDate"),
  };
  const optionalStrings = [
    "lastName",
    "dateOfBirth",
    "gender",
    "mobile",
    "email",
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "pincode",
    "stateStudentId",
    "mediumId",
    "motherTongue",
    "languageSubjectChoice",
    "communityCategory",
    "supportNeeds",
    "bloodGroup",
    "bankAccountRef",
    "commuteMode",
  ];
  for (const key of optionalStrings) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") payload[key] = value;
  }
  for (const key of ["isFirstGenLearner", "isDifferentlyAbled", "isHosteller", "usesSchoolTransport"]) {
    payload[key] = formData.get(key) === "on";
  }

  const res = await apiFetch("/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return await parseApiError(res);
  }

  const { data } = (await res.json()) as { data: { id: string } };
  revalidatePath("/admin/students");

  // Class is required (validated above), so an enrolment is always attempted now.
  const yearRes = await apiFetch("/academic-years");
  const currentYear = yearRes.ok
    ? ((await yearRes.json()) as { data: { id: string; isCurrent: boolean }[] }).data.find(
        (y) => y.isCurrent,
      )
    : undefined;

  if (!currentYear) {
    // Student exists; just no current academic year configured to enrol into.
    return {
      error:
        "Student record was created, but there's no current academic year set — add the class enrolment from the profile once one is configured.",
      studentId: data.id,
    };
  }

  const rollNo = formData.get("rollNo");
  const enrolmentPayload: Record<string, unknown> = { academicYearId: currentYear.id, sectionId };
  if (typeof rollNo === "string" && rollNo.trim() !== "") enrolmentPayload.rollNo = Number(rollNo);
  const enrolmentType = formData.get("enrolmentType");
  if (typeof enrolmentType === "string" && enrolmentType.trim() !== "") enrolmentPayload.enrolmentType = enrolmentType;
  const enrolmentRemarks = formData.get("enrolmentRemarks");
  if (typeof enrolmentRemarks === "string" && enrolmentRemarks.trim() !== "") enrolmentPayload.remarks = enrolmentRemarks.trim();

  const enrolmentRes = await apiFetch(`/students/${data.id}/enrolments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(enrolmentPayload),
  });

  if (!enrolmentRes.ok) {
    // The student record itself was created successfully -- don't let that fact
    // get lost just because the class enrolment failed (e.g. roll number clash).
    return {
      error: `Student record was created, but the class enrolment couldn't be saved: ${await readError(enrolmentRes)}. Add it manually from the profile.`,
      studentId: data.id,
    };
  }

  redirect(`/admin/students/${data.id}`);
}

/** Basic info (student) and address (person) are two different backend
 * resources, but the profile shows them as one "Save changes" action with a
 * single button -- both PATCHes fire from this one action so the admin never
 * has to remember there were ever two separate saves. */
export async function updateStudentProfileAction(
  studentId: string,
  personId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const studentPayload: Record<string, unknown> = {};
  const optionalStrings = [
    "admissionNo",
    "stateStudentId",
    "mediumId",
    "motherTongue",
    "languageSubjectChoice",
    "communityCategory",
    "supportNeeds",
    "bloodGroup",
    "bankAccountRef",
    "commuteMode",
  ];
  for (const key of optionalStrings) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") studentPayload[key] = value;
  }
  for (const key of ["isFirstGenLearner", "isDifferentlyAbled", "isHosteller", "usesSchoolTransport"]) {
    studentPayload[key] = formData.get(key) === "on";
  }

  const addressPayload: Record<string, unknown> = {};
  for (const key of ["addressLine1", "addressLine2", "city", "state", "pincode"]) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") addressPayload[key] = value;
  }

  const [studentRes, addressRes] = await Promise.all([
    apiFetch(`/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentPayload),
    }),
    apiFetch(`/persons/${personId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressPayload),
    }),
  ]);

  const errors: string[] = [];
  if (!studentRes.ok) errors.push(await readError(studentRes));
  if (!addressRes.ok) errors.push(await readError(addressRes));
  if (errors.length > 0) return { error: errors.join(" ") };

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/students");
  return {};
}

export async function leaveStudentAction(
  studentId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const status = formData.get("status");
  const dateOfLeaving = formData.get("dateOfLeaving");
  const payload: Record<string, unknown> = { status };
  if (typeof dateOfLeaving === "string" && dateOfLeaving.trim() !== "") {
    payload.dateOfLeaving = dateOfLeaving;
  }

  const res = await apiFetch(`/students/${studentId}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { error: await readError(res) };
  }

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/students");
  return {};
}

export async function createEnrolmentAction(
  studentId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = {
    academicYearId: formData.get("academicYearId"),
    sectionId: formData.get("sectionId"),
  };
  const rollNo = formData.get("rollNo");
  if (typeof rollNo === "string" && rollNo.trim() !== "") payload.rollNo = Number(rollNo);
  const enrolmentType = formData.get("enrolmentType");
  if (typeof enrolmentType === "string" && enrolmentType.trim() !== "") {
    payload.enrolmentType = enrolmentType;
  }

  const res = await apiFetch(`/students/${studentId}/enrolments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { error: await readError(res) };
  }

  revalidatePath(`/admin/students/${studentId}`);
  return {};
}

/** Roll number / status / outcome / remarks edit -- never touches section_id.
 * Section changes go through transferEnrolmentSectionAction instead, which
 * creates a new enrolment row so the old section is preserved in history. */
export async function updateEnrolmentAction(
  studentId: string,
  enrolmentId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = {};
  const rollNo = formData.get("rollNo");
  if (typeof rollNo === "string" && rollNo.trim() !== "") payload.rollNo = Number(rollNo);
  const status = formData.get("status");
  if (typeof status === "string" && status.trim() !== "") payload.status = status;
  const outcome = formData.get("outcome");
  if (typeof outcome === "string" && outcome.trim() !== "") payload.outcome = outcome;
  const remarks = formData.get("remarks");
  if (typeof remarks === "string" && remarks.trim() !== "") payload.remarks = remarks;

  const res = await apiFetch(`/enrolments/${enrolmentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { error: await readError(res) };
  }

  revalidatePath(`/admin/students/${studentId}`);
  return {};
}

/** Creates a new ACTIVE enrolment row in the target section and supersedes the
 * old one to TRANSFERRED_SECTION -- the old row (and its section/roll no) stays
 * in history rather than being overwritten. Hits POST /enrolments/:id/transfer. */
export async function transferEnrolmentSectionAction(
  studentId: string,
  enrolmentId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = { sectionId: formData.get("sectionId") };
  const rollNo = formData.get("rollNo");
  if (typeof rollNo === "string" && rollNo.trim() !== "") payload.rollNo = Number(rollNo);
  const remarks = formData.get("remarks");
  if (typeof remarks === "string" && remarks.trim() !== "") payload.remarks = remarks;

  const res = await apiFetch(`/enrolments/${enrolmentId}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { error: await readError(res) };
  }

  revalidatePath(`/admin/students/${studentId}`);
  return {};
}

export async function createGuardianAction(
  studentId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const payload: Record<string, unknown> = {
    personId: formData.get("personId"),
    relationship: formData.get("relationship"),
    isPrimaryContact: formData.get("isPrimaryContact") === "on",
  };
  const occupation = formData.get("occupation");
  if (typeof occupation === "string" && occupation.trim() !== "") payload.occupation = occupation;

  const res = await apiFetch(`/students/${studentId}/guardians`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { error: await readError(res) };
  }

  revalidatePath(`/admin/students/${studentId}`);
  return {};
}

export async function setPrimaryGuardianAction(studentId: string, guardianLinkId: string): Promise<void> {
  await apiFetch(`/guardian-links/${guardianLinkId}/set-primary`, { method: "POST" });
  revalidatePath(`/admin/students/${studentId}`);
}

export async function revokeGuardianAction(studentId: string, guardianLinkId: string): Promise<void> {
  await apiFetch(`/guardian-links/${guardianLinkId}/revoke`, { method: "POST" });
  revalidatePath(`/admin/students/${studentId}`);
}

export async function freezeWalletAction(
  studentId: string,
  _prev: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const reason = formData.get("reason");
  const res = await apiFetch(`/students/${studentId}/wallet/freeze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/students/${studentId}`);
  return {};
}

export async function unfreezeWalletAction(studentId: string): Promise<void> {
  await apiFetch(`/students/${studentId}/wallet/unfreeze`, { method: "POST" });
  revalidatePath(`/admin/students/${studentId}`);
}

