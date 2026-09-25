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
    // Collected on the real "Enroll students" admission page -- editable here
    // too (student-level fields; see UpdateStudentDto).
    "religion",
    "nationality",
    "admissionQuota",
    "previousSchool",
    "emergencyContactName",
    "emergencyContactPhone",
  ];
  for (const key of optionalStrings) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim() !== "") studentPayload[key] = value;
  }
  for (const key of ["isFirstGenLearner", "isDifferentlyAbled", "isHosteller", "usesSchoolTransport"]) {
    studentPayload[key] = formData.get(key) === "on";
  }

  const addressPayload: Record<string, unknown> = {};
  for (const key of [
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "pincode",
    // Person-level fields collected on the "Enroll students" page -- editable
    // here too (see UpdatePersonDto).
    "district",
    "aadhaarLast4",
    "gender",
    "dateOfBirth",
  ]) {
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

/**
 * Both of these previously discarded the response entirely (fire-and-forget) --
 * a real backend rejection (already revoked, unauthorized, status conflict, the
 * link belonging to a different student) produced zero feedback: the admin saw
 * the row "un-change" with no explanation. Now returns a real error the caller
 * can show, same as every other action in this file.
 */
export async function setPrimaryGuardianAction(
  studentId: string,
  guardianLinkId: string,
): Promise<{ error?: string }> {
  const res = await apiFetch(`/guardian-links/${guardianLinkId}/set-primary`, { method: "POST" });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/students/${studentId}`);
  return {};
}

export async function revokeGuardianAction(
  studentId: string,
  guardianLinkId: string,
): Promise<{ error?: string }> {
  const res = await apiFetch(`/guardian-links/${guardianLinkId}/revoke`, { method: "POST" });
  if (!res.ok) return { error: await readError(res) };
  revalidatePath(`/admin/students/${studentId}`);
  return {};
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

export interface GuardianCredential {
  label: string;
  username: string;
  temporaryPassword: string;
  /** The guardian's own real personId -- lets the success screen link
   * straight to their profile (`/admin/parents/:personId`) instead of
   * leaving the admin to search for them separately. */
  personId: string;
}

export interface PublishEnrollmentState {
  error?: string;
  fieldErrors?: Record<string, string>;
  missing?: string[];
  success?: {
    studentId: string;
    admissionNo: string;
    credentials: GuardianCredential[];
    warnings: string[];
  };
}

/** Splits a single "Full name" field into firstName/lastName -- the reference
 * design's Enroll screen has one Full name field, but CreateStudentDto (and
 * every other real person-creation path in this app) is firstName/lastName.
 * First token is firstName, the rest (if any) is lastName -- an honest,
 * documented convention, not a fabricated field. */
function splitName(full: string): { firstName: string; lastName?: string } {
  const trimmed = full.trim().replace(/\s+/g, " ");
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) return { firstName: trimmed };
  return { firstName: trimmed.slice(0, spaceIdx), lastName: trimmed.slice(spaceIdx + 1) };
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** Real-work path behind the "Publish" button on the Enroll students page.
 *
 * There is no DRAFT student status in the schema (student_status_check only
 * allows ACTIVE/LEFT/TC_ISSUED/ARCHIVED -- checked directly against the live
 * DB before building this form), so "Save as draft"/"Save" on that page are
 * real `localStorage` persistence only (see EnrollStudentForm.tsx) -- nothing
 * server-side happens until this action runs. Publish is the one moment a
 * real ACTIVE student record (and, if guardian details were given, a real
 * parent login) gets created -- matching the reference mockup's own
 * publishStudent(), which is the only one of its three functions that does
 * any validation, reinterpreted here with real backend calls instead of a
 * fake toast.
 *
 * Runs multiple dependent POSTs in sequence (student -> enrolment -> each
 * guardian -> transport). A failure partway through does NOT roll back
 * earlier steps (there is no cross-service transaction spanning Students,
 * Guardians, and Transport) -- exactly like createStudentAction's own
 * existing "student created, enrolment failed" partial-success handling
 * elsewhere in this file. Every step's failure is surfaced with the
 * studentId still returned so the admin can finish manually from the
 * profile instead of silently losing a partially-created admission.
 */
export async function publishEnrollmentAction(
  _prev: PublishEnrollmentState,
  formData: FormData,
): Promise<PublishEnrollmentState> {
  const fullName = str(formData, "fullName");
  const dateOfBirth = str(formData, "dateOfBirth");
  const sectionId = str(formData, "sectionId");
  const fatherName = str(formData, "fatherName");
  const fatherPhone = str(formData, "fatherPhone");
  // Set by ExistingParentPicker (Task 2 fix) when the admin searched for and
  // picked an already-existing real parent account instead of typing in a new
  // one -- the father/mother name+phone requirement below is satisfied by
  // that selection, not by the (now-disabled) name/phone inputs.
  const fatherExistingPersonId = str(formData, "fatherPersonId");
  const motherExistingPersonId = str(formData, "motherPersonId");

  // Matches the reference design's own `stuReq` list exactly: Full name, Date
  // of birth, Standard+Section, Father/guardian name, Father/guardian phone.
  const missing: string[] = [];
  if (!fullName) missing.push("Full name");
  if (!dateOfBirth) missing.push("Date of birth");
  if (!sectionId) missing.push("Section");
  if (!fatherExistingPersonId) {
    if (!fatherName) missing.push("Father / guardian name");
    if (!fatherPhone) missing.push("Father / guardian phone");
  }
  if (missing.length > 0) {
    return { missing, error: `Fill the compulsory columns to publish: ${missing.join(", ")}` };
  }

  const { firstName, lastName } = splitName(fullName);
  const warnings: string[] = [];
  const credentials: GuardianCredential[] = [];

  // 1. Student (+ person). The form intentionally has no separate "student's
  // own mobile/email" field (the reference design doesn't have one either --
  // only guardians carry contact fields), but person_has_contact requires the
  // student's own person row to carry at least one. person.mobile is unique, so
  // reusing the guardian's phone made the guardian's own parent account fail
  // with "already exists". A unique per-admission placeholder email (same
  // student…@sis.in convention as the seeded students) satisfies the check.
  const studentAdmissionNo = str(formData, "admissionNo");
  const studentPayload: Record<string, unknown> = {
    firstName,
    admissionNo: studentAdmissionNo,
    admissionDate: str(formData, "dateOfAdmission") || new Date().toISOString().slice(0, 10),
    dateOfBirth,
    email: `student${studentAdmissionNo.toLowerCase().replace(/[^a-z0-9]/g, "")}@sis.in`,
  };
  if (lastName) studentPayload.lastName = lastName;
  const passthroughStrings: [string, string][] = [
    ["gender", "gender"],
    ["bloodGroup", "bloodGroup"],
    ["aadhaarLast4", "aadhaarLast4"],
    ["motherTongue", "motherTongue"],
    ["secondLanguage", "languageSubjectChoice"],
    ["religion", "religion"],
    ["community", "communityCategory"],
    ["nationality", "nationality"],
    ["admissionQuota", "admissionQuota"],
    ["previousSchool", "previousSchool"],
    ["emergencyName", "emergencyContactName"],
    ["emergencyPhone", "emergencyContactPhone"],
    ["address", "addressLine1"],
    ["cityArea", "city"],
    ["pincode", "pincode"],
    ["district", "district"],
  ];
  for (const [formKey, payloadKey] of passthroughStrings) {
    const v = str(formData, formKey);
    if (v) studentPayload[payloadKey] = v;
  }
  studentPayload.isHosteller = str(formData, "residence") === "HOSTELLER";

  const studentRes = await apiFetch("/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(studentPayload),
  });
  if (!studentRes.ok) {
    return await parseApiError(studentRes);
  }
  const { data: student } = (await studentRes.json()) as {
    data: { id: string; admissionNo: string; person: { id: string } };
  };
  const studentId = student.id;
  const studentPersonId = student.person.id;

  // Photographs picked during form-filling (Student/Father/Mother dropzones)
  // travel through the same real <form action={formAction}> submission as
  // every other field -- the file inputs are uncontrolled, so the browser
  // includes the actual File objects in this FormData automatically. Real
  // personIds only exist from here on (student's own person row just got
  // created above; father/mother's below), so uploads happen inline as each
  // personId becomes available, reusing the exact same POST /persons/:id/photo
  // uploadPersonPhotoAction itself calls -- not a new upload path.
  async function uploadGuardianOrStudentPhoto(personId: string | null, file: FormDataEntryValue | null, label: string): Promise<void> {
    if (!personId) return;
    if (!(file instanceof File) || file.size === 0) return;
    const uploadBody = new FormData();
    uploadBody.set("photo", file);
    const photoRes = await apiFetch(`/persons/${personId}/photo`, { method: "POST", body: uploadBody });
    if (!photoRes.ok) {
      warnings.push(`${label} photo couldn't be uploaded: ${await readError(photoRes)}. Add it from the profile instead.`);
    }
  }

  await uploadGuardianOrStudentPhoto(studentPersonId, formData.get("studentPhoto"), "Student");

  // Documents picked during form-filling (Aadhaar copy/Transfer certificate/
  // Birth certificate) -- real studentId already exists at this point, so
  // these upload now too, reusing the exact same real POST /documents/upload
  // the student profile's own CertificatesSection uses (ownerDomain PEOPLE,
  // ownerObjectType "student", category "STUDENT_ACADEMIC" -- same values
  // that page passes).
  async function uploadStudentDocument(file: FormDataEntryValue | null, docType: string): Promise<void> {
    if (!(file instanceof File) || file.size === 0) return;
    const uploadBody = new FormData();
    uploadBody.set("file", file);
    uploadBody.set("ownerDomain", "PEOPLE");
    uploadBody.set("ownerObjectType", "student");
    uploadBody.set("ownerObjectId", studentId);
    uploadBody.set("category", "STUDENT_ACADEMIC");
    uploadBody.set("docType", docType);
    const docRes = await apiFetch("/documents/upload", { method: "POST", body: uploadBody });
    if (!docRes.ok) {
      warnings.push(`${docType} couldn't be uploaded: ${await readError(docRes)}. Add it from the profile instead.`);
    }
  }
  await uploadStudentDocument(formData.get("aadhaarCopyDoc"), "Aadhaar copy");
  await uploadStudentDocument(formData.get("transferCertificate"), "Transfer certificate");
  await uploadStudentDocument(formData.get("birthCertificate"), "Birth certificate");

  // 2. Enrolment (class/section/roll).
  const academicYearId = str(formData, "academicYearId");
  const enrolmentPayload: Record<string, unknown> = { academicYearId, sectionId };
  const rollNo = str(formData, "rollNo");
  if (rollNo) enrolmentPayload.rollNo = Number(rollNo);
  if (!academicYearId) {
    warnings.push("No current academic year is configured -- class/section wasn't enrolled. Add it from the profile.");
  } else {
    const enrolRes = await apiFetch(`/students/${studentId}/enrolments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrolmentPayload),
    });
    if (!enrolRes.ok) {
      warnings.push(`Class enrolment couldn't be saved: ${await readError(enrolRes)}`);
    }
  }

  // 3+4. Guardians -- each one is a brand-new person (POST /persons, the only
  // real path in this app that also issues a login) followed by the
  // guardian_link that connects them to this student (POST
  // /students/:id/guardians). Reused end-to-end from CreateParentModal's own
  // real flow, not reinvented.
  async function createGuardian(opts: {
    relationship: string;
    isPrimaryContact: boolean;
    name: string;
    phone: string;
    email: string;
    occupation: string;
    aadhaarLast4: string;
    incomeRupees: string;
    /** Real, admin-set password for a NEW guardian's login (min 8 chars,
     * enforced by the same real CreatePersonDto every other real
     * person-creation flow already uses) -- blank means auto-generate, same
     * as CreateParentModal's own optional password field. Ignored entirely
     * when existingPersonId is set (that account already has one). */
    password: string;
    /** Set by ExistingParentPicker (Task 2 fix) -- when present, this guardian
     * is an already-existing real parent account the admin searched for and
     * picked, so no new POST /persons happens at all: this skips straight to
     * the guardian_link, the same real endpoint either path ends at. This is
     * what prevents the duplicate-account risk the standalone "Enroll
     * Parents" page and this page's own father/mother step used to create
     * independently (same phone/email re-entered here would otherwise hit
     * the backend's real unique constraint and 409 mid-Publish, after the
     * whole form was filled in). */
    existingPersonId?: string;
  }): Promise<string | null> {
    let resolvedPersonId: string;
    let credential: { username: string; temporaryPassword: string } | null = null;

    if (opts.existingPersonId) {
      resolvedPersonId = opts.existingPersonId;
    } else {
      if (!opts.name) return null;
      const { firstName: gFirst, lastName: gLast } = splitName(opts.name);
      const identifierType = opts.phone ? "MOBILE" : opts.email ? "EMAIL" : null;
      if (!identifierType) {
        warnings.push(`${opts.relationship === "FATHER" ? "Father" : "Mother"}'s phone or email is needed to create their parent login -- guardian wasn't linked.`);
        return null;
      }
      const personPayload: Record<string, unknown> = {
        firstName: gFirst,
        identifierType,
        identifierValue: identifierType === "MOBILE" ? opts.phone : opts.email,
        initialRole: { roleCode: "PARENT", scopeType: "SCHOOL" },
      };
      if (gLast) personPayload.lastName = gLast;
      if (opts.aadhaarLast4) personPayload.aadhaarLast4 = opts.aadhaarLast4;
      if (opts.password && opts.password.trim() !== "") personPayload.initialPassword = opts.password.trim();
      const personRes = await apiFetch("/persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personPayload),
      });
      if (!personRes.ok) {
        // The backend's own real unique constraint on login_identifier turns a
        // genuine duplicate (this phone/email already has an account) into a
        // clean 409 here ("An account with this email or mobile number already
        // exists.") -- readError() below surfaces that message as-is, not a
        // raw 500 or a silent failure. Searching first via ExistingParentPicker
        // (above) is how this is normally avoided; this is the fallback for
        // when it wasn't used.
        warnings.push(`Couldn't create ${opts.relationship.toLowerCase()}'s parent account: ${await readError(personRes)}`);
        return null;
      }
      const { data: person } = (await personRes.json()) as {
        data: { person: { id: string }; temporaryPassword: string };
      };
      resolvedPersonId = person.person.id;

      if (identifierType === "MOBILE" && opts.email) {
        await apiFetch(`/persons/${resolvedPersonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: opts.email }),
        });
      }

      credential = {
        username: identifierType === "MOBILE" ? opts.phone : opts.email,
        temporaryPassword: person.temporaryPassword,
      };
    }

    const linkPayload: Record<string, unknown> = {
      personId: resolvedPersonId,
      relationship: opts.relationship,
      isPrimaryContact: opts.isPrimaryContact,
    };
    if (opts.occupation) linkPayload.occupation = opts.occupation;
    if (opts.incomeRupees) {
      linkPayload.annualIncomePaise = Math.round(Number(opts.incomeRupees) * 100);
    }
    const linkRes = await apiFetch(`/students/${studentId}/guardians`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(linkPayload),
    });
    if (!linkRes.ok) {
      warnings.push(`${opts.name || "Selected parent"} couldn't be linked as a guardian: ${await readError(linkRes)}`);
      return resolvedPersonId;
    }
    if (credential) {
      credentials.push({
        label: `${opts.relationship === "FATHER" ? "Father" : "Mother"} · ${opts.name}`,
        personId: resolvedPersonId,
        ...credential,
      });
    }
    return resolvedPersonId;
  }

  const fatherPersonId = await createGuardian({
    relationship: str(formData, "fatherRelationship") || "FATHER",
    isPrimaryContact: true,
    name: fatherName,
    phone: fatherPhone,
    email: str(formData, "fatherEmail"),
    occupation: str(formData, "fatherOccupation"),
    aadhaarLast4: str(formData, "fatherAadhaarLast4"),
    incomeRupees: str(formData, "fatherIncome"),
    password: str(formData, "fatherPassword"),
    existingPersonId: fatherExistingPersonId || undefined,
  });
  // Skipped silently if the father/guardian account couldn't be created (personId
  // is null) -- the existing warning above already explains why, no need to pile
  // on a second "photo couldn't be attached" message for the same root cause.
  await uploadGuardianOrStudentPhoto(fatherPersonId, formData.get("fatherPhoto"), "Father / guardian");

  const motherName = str(formData, "motherName");
  if (motherName || motherExistingPersonId) {
    const motherPersonId = await createGuardian({
      relationship: "MOTHER",
      isPrimaryContact: false,
      name: motherName,
      phone: str(formData, "motherPhone"),
      email: str(formData, "motherEmail"),
      occupation: str(formData, "motherOccupation"),
      aadhaarLast4: str(formData, "motherAadhaarLast4"),
      incomeRupees: "",
      password: str(formData, "motherPassword"),
      existingPersonId: motherExistingPersonId || undefined,
    });
    await uploadGuardianOrStudentPhoto(motherPersonId, formData.get("motherPhoto"), "Mother");
  }
  // No mother entered at all -- mother photo (if one was somehow picked) is
  // dropped silently, matching "skip silently, don't error" for a guardian
  // that was never created.

  // 5. Bus route + boarding stop -- only if both were actually chosen.
  const routeStopId = str(formData, "routeStopId");
  if (routeStopId && academicYearId) {
    const transportRes = await apiFetch("/student-transport-allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        routeStopId,
        academicYearId,
        // Direction isn't a field on the reference design's own Class mapping
        // card -- BOTH (pickup and drop) is the sensible default for a new
        // admission rather than fabricating a UI control the mockup never had.
        direction: "BOTH",
      }),
    });
    if (transportRes.ok) {
      await apiFetch(`/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usesSchoolTransport: true }),
      });
    } else {
      warnings.push(`Bus route couldn't be assigned: ${await readError(transportRes)}`);
    }
  }

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}`);

  return {
    success: {
      studentId,
      admissionNo: student.admissionNo,
      credentials,
      warnings,
    },
  };
}

