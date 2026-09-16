"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { parseApiError } from "@/lib/form-errors";

export interface FormActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
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
export async function resetFacultyPasswordAction(staffId: string, personId: string, newPassword?: string): Promise<ResetPasswordState> {
  const res = await apiFetch(`/persons/${personId}/password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword: newPassword || undefined }),
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
      initialPassword: formData.get("initialPassword") || undefined,
      initialRole: { roleCode: "FACULTY", scopeType: "SCHOOL" },
    }),
  });

  if (!personRes.ok) {
    return await parseApiError(personRes);
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
    const staffError = await parseApiError(staffRes);
    return {
      error: `Faculty account was created (temporary password: ${temporaryPassword}), but the employment details couldn't be saved: ${staffError.error ?? "see the highlighted field(s) below"}. Person ID ${personId} — add the staff record for them from an edit screen once available, or contact engineering.`,
      fieldErrors: staffError.fieldErrors,
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

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Suggests the next employee_no (see staff.service.ts's own
 * getNextEmployeeNo -- EMP<4-digit seq>, +1 on the highest existing one).
 * Same fails-soft-to-empty-string contract as students'
 * getNextAdmissionNoAction. */
export async function getNextEmployeeIdAction(): Promise<string> {
  const res = await apiFetch("/staff/next-employee-id");
  if (!res.ok) return "";
  const { data } = (await res.json()) as { data: { employeeNo: string } };
  return data.employeeNo;
}

export interface PublishFacultyState {
  error?: string;
  fieldErrors?: Record<string, string>;
  missing?: string[];
  success?: {
    staffId: string;
    employeeNo: string;
    username: string;
    temporaryPassword: string;
    warnings: string[];
  };
}

/** Real-work path behind the "Publish" button on the Admit Faculty page
 * (/admin/faculty/admit). Same two-step orchestration createFacultyAction
 * above already uses for Faculty's real login (POST /persons, then POST
 * /staff against the resulting personId) -- reused here, not duplicated,
 * just fed from the new page's own field set (department/campus/blood
 * group/employment type/academic credentials/professional info -- see
 * query.md's "Admit Faculty page" section for the new staff columns behind
 * them) and restructured around the reference design's own `facReq` list:
 * Full name, Designation, Department, Joining date, Official email, Phone
 * number.
 *
 * Official email is the one login identifier POST /persons can set
 * (identifierType=EMAIL, matching the reference's own "Official email
 * becomes the app username" note); phone number is a second real column on
 * the same `person` row (person.mobile) that CreatePersonDto has no slot
 * for, so it's attached with a follow-up PATCH /persons/:id right after --
 * same two-PATCH-targets-one-button shape updateFacultyProfileAction
 * already uses for staff+person, just at creation time instead of edit
 * time. date_of_birth and gender ride along on that same PATCH.
 *
 * There is no DRAFT staff status (staff_status_check only allows
 * ACTIVE/ON_LEAVE/EXITED -- checked directly against the live schema before
 * building this), so Save as draft/Save on that page are real localStorage
 * persistence only (see AdmitFacultyForm.tsx) -- nothing server-side until
 * this action runs.
 */
export async function publishFacultyAction(
  _prev: PublishFacultyState,
  formData: FormData,
): Promise<PublishFacultyState> {
  const fullName = str(formData, "fullName");
  const designation = str(formData, "designation");
  const departmentId = str(formData, "departmentId");
  const dateOfJoining = str(formData, "dateOfJoining");
  const officialEmail = str(formData, "officialEmail");
  const phoneNumber = str(formData, "phoneNumber");

  const missing: string[] = [];
  if (!fullName) missing.push("Full name");
  if (!designation) missing.push("Designation");
  if (!departmentId) missing.push("Department");
  if (!dateOfJoining) missing.push("Joining date");
  if (!officialEmail) missing.push("Official email");
  if (!phoneNumber) missing.push("Phone number");
  if (missing.length > 0) {
    return { missing, error: `Fill the compulsory columns to publish: ${missing.join(", ")}` };
  }

  const nameParts = fullName.replace(/\s+/g, " ").trim();
  const spaceIdx = nameParts.indexOf(" ");
  const firstName = spaceIdx === -1 ? nameParts : nameParts.slice(0, spaceIdx);
  const lastName = spaceIdx === -1 ? undefined : nameParts.slice(spaceIdx + 1);

  const tempPassword = str(formData, "temporaryPassword");
  const confirmPassword = str(formData, "confirmPassword");
  if (tempPassword && tempPassword !== confirmPassword) {
    return { error: "Temporary password and confirm password don't match." };
  }

  // 1. Person + login (official email is the app username, matching the
  // reference design's own note).
  const personPayload: Record<string, unknown> = {
    firstName,
    identifierType: "EMAIL",
    identifierValue: officialEmail,
    initialRole: { roleCode: "FACULTY", scopeType: "SCHOOL" },
  };
  if (lastName) personPayload.lastName = lastName;
  const gender = str(formData, "gender");
  if (gender) personPayload.gender = gender;
  const aadhaarLast4 = str(formData, "aadhaarLast4");
  if (aadhaarLast4) personPayload.aadhaarLast4 = aadhaarLast4;
  const address = str(formData, "address");
  if (address) personPayload.addressLine1 = address;
  const district = str(formData, "district");
  if (district) personPayload.district = district;
  if (tempPassword) personPayload.initialPassword = tempPassword;

  const personRes = await apiFetch("/persons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(personPayload),
  });
  if (!personRes.ok) {
    return await parseApiError(personRes);
  }
  const { data: personResult } = (await personRes.json()) as {
    data: { person: { id: string }; temporaryPassword: string };
  };
  const personId = personResult.person.id;
  const temporaryPassword = personResult.temporaryPassword;
  const warnings: string[] = [];

  // Staff photograph picked during form-filling (AdmitFacultyForm's own
  // PhotoDropzone) -- the real personId only exists from here on, so the
  // upload happens now, reusing the exact same POST /persons/:id/photo
  // uploadPersonPhotoAction itself calls (not a new upload path). Attached
  // to the person row directly, so it survives even if the staff (employment)
  // POST below fails.
  const staffPhoto = formData.get("staffPhoto");
  if (staffPhoto instanceof File && staffPhoto.size > 0) {
    const uploadBody = new FormData();
    uploadBody.set("photo", staffPhoto);
    const photoRes = await apiFetch(`/persons/${personId}/photo`, { method: "POST", body: uploadBody });
    if (!photoRes.ok) {
      warnings.push(`Staff photograph couldn't be uploaded: ${await readError(photoRes)}. Add it from the profile instead.`);
    }
  }

  // Phone number + date of birth ride on a follow-up PATCH -- person.mobile
  // has no slot in CreatePersonDto (only ONE of email/mobile can be the
  // login identifier), but is a real column UpdatePersonDto already accepts.
  const dateOfBirth = str(formData, "dateOfBirth");
  const patchPayload: Record<string, unknown> = { mobile: phoneNumber };
  if (dateOfBirth) patchPayload.dateOfBirth = dateOfBirth;
  const patchRes = await apiFetch(`/persons/${personId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patchPayload),
  });
  if (!patchRes.ok) {
    warnings.push(`Phone number couldn't be saved: ${await readError(patchRes)}. Add it from the profile.`);
  }

  // 2. Staff (employment) record.
  const staffPayload: Record<string, unknown> = {
    personId,
    employeeNo: str(formData, "employeeNo") || undefined,
    designation,
    departmentId,
    dateOfJoining,
    isTeaching: formData.get("isTeaching") === "on",
  };
  const stringFields: [string, string][] = [
    ["campusId", "campusId"],
    ["bloodGroup", "bloodGroup"],
    ["employmentType", "employmentType"],
    ["staffRoom", "staffRoom"],
    ["emergencyContactName", "emergencyContactName"],
    ["emergencyContactPhone", "emergencyContactPhone"],
    ["highestQualification", "highestQualification"],
    ["specialization", "specialization"],
    ["university", "university"],
    ["areasOfExpertise", "areasOfExpertise"],
    ["certifications", "certifications"],
    ["workshopsTraining", "workshopsTraining"],
    ["achievementsAwards", "achievementsAwards"],
  ];
  for (const [formKey, payloadKey] of stringFields) {
    const v = str(formData, formKey);
    if (v) staffPayload[payloadKey] = v;
  }
  const experienceYears = str(formData, "experienceYears");
  if (experienceYears) staffPayload.experienceYears = Number(experienceYears);
  const yearOfGraduation = str(formData, "yearOfGraduation");
  if (yearOfGraduation) staffPayload.yearOfGraduation = Number(yearOfGraduation);
  if (formData.get("tetNetCleared") === "on") staffPayload.tetNetCleared = true;

  const staffRes = await apiFetch("/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(staffPayload),
  });
  if (!staffRes.ok) {
    // The person (with login) already exists -- don't lose track of that
    // just because the employment details failed, same partial-success
    // handling createFacultyAction above already has.
    const staffError = await parseApiError(staffRes);
    return {
      error: `Faculty login was created (temporary password: ${temporaryPassword}), but the employment details couldn't be saved: ${staffError.error ?? "see the highlighted field(s) below"}. Person ID ${personId} — add the staff record for them from an edit screen once available, or contact engineering.`,
      fieldErrors: staffError.fieldErrors,
    };
  }
  const { data: staff } = (await staffRes.json()) as { data: { id: string; employeeNo: string } };

  // Documents picked during form-filling (AdmitFacultyForm's own
  // MultiFileDropzone/AttachRow) -- the real staffId only exists from here
  // on, so the uploads happen now, reusing the exact same real
  // POST /documents/upload endpoint the faculty profile's own
  // CertificatesSection already uses (ownerDomain PEOPLE, ownerObjectType
  // "staff", category "STAFF_HR" -- same values that page passes).
  async function uploadStaffDocument(file: FormDataEntryValue | null, docType: string): Promise<void> {
    if (!(file instanceof File) || file.size === 0) return;
    const uploadBody = new FormData();
    uploadBody.set("file", file);
    uploadBody.set("ownerDomain", "PEOPLE");
    uploadBody.set("ownerObjectType", "staff");
    uploadBody.set("ownerObjectId", staff.id);
    uploadBody.set("category", "STAFF_HR");
    uploadBody.set("docType", docType);
    const docRes = await apiFetch("/documents/upload", { method: "POST", body: uploadBody });
    if (!docRes.ok) {
      warnings.push(`${docType.replace(/_/g, " ").toLowerCase()} couldn't be uploaded: ${await readError(docRes)}. Add it from the profile instead.`);
    }
  }
  await uploadStaffDocument(formData.get("aadhaarCopy"), "Aadhaar copy");
  await uploadStaffDocument(formData.get("experienceLetter"), "Experience letter");
  await uploadStaffDocument(formData.get("policeVerification"), "Police verification");
  for (const cert of formData.getAll("qualificationCertificates")) {
    await uploadStaffDocument(cert, "Qualification certificate");
  }

  revalidatePath("/admin/faculty");

  return {
    success: {
      staffId: staff.id,
      employeeNo: staff.employeeNo,
      username: officialEmail,
      temporaryPassword,
      warnings,
    },
  };
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
