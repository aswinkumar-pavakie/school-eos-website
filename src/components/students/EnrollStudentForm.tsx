"use client";

// Enroll students -- pixel-matched to SIS ADMIN's reference "Enroll students"
// screen (Admin Portal.dc.html: studentGroups/stuReq/draftStudent/
// saveStudentRec/publishStudent), rebuilt with REAL backend calls. Every
// field below is either:
//   (a) an existing real column, reused as-is (Full name/DOB/gender/blood
//       group/mother tongue/second language[=languageSubjectChoice]/
//       community/standard/section/roll no/residence[=isHosteller]/bus
//       route+boarding stop[=student_transport_allocation]/father-mother
//       name+phone+email+occupation+income[=a new POST /persons + existing
//       guardian_link]/address/city/pincode), or
//   (b) a genuinely new column added via query.md (Aadhaar last 4, district,
//       religion, nationality, admission quota, previous school, emergency
//       contact name/phone -- see query.md's "Enroll Students page" section
//       for the exact DDL), or
//   (c) honestly disabled with a one-line reason when this schema has no
//       real backing for it yet (ID card issued on, House, Class teacher,
//       Classroom, Hostel block & room, Fee category -- see query.md for
//       why each one specifically isn't wired).
//
// Photographs and document attachments (Aadhaar copy/TC/birth certificate)
// need a real personId/studentId to upload against (PersonPhotoEditor /
// CertificatesSection both do), which doesn't exist until Publish actually
// creates the student -- so those controls stay disabled here with a
// "available after Publish" note, and the success state links straight to
// the new student's profile, where both components already exist and work.
//
// Save as draft / Save: there is no DRAFT status in the `student` table's own
// CHECK constraint (only ACTIVE/LEFT/TC_ISSUED/ARCHIVED are allowed), so
// these two buttons are real `localStorage` persistence only -- nothing is
// sent to the backend until Publish. This is stated in the UI, not hidden.

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  publishEnrollmentAction,
  type PublishEnrollmentState,
} from "@/app/(dashboard)/admin/students/actions";
import { ExistingParentPicker, type ExistingParentHit } from "./ExistingParentPicker";

const DRAFT_KEY = "enrollStudentDraft:v1";

interface Grade {
  id: string;
  name: string;
}
interface Section {
  id: string;
  gradeId: string;
  name: string;
}
interface RouteOption {
  id: string;
  label: string;
  stops: { id: string; label: string }[];
}

const emptyValues = {
  fullName: "",
  dateOfAdmission: new Date().toISOString().slice(0, 10),
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  aadhaarLast4: "",
  motherTongue: "",
  secondLanguage: "",
  religion: "",
  community: "",
  nationality: "",
  admissionQuota: "",
  previousSchool: "",

  gradeId: "",
  sectionId: "",
  rollNo: "",
  residence: "DAY",
  routeId: "",
  routeStopId: "",

  fatherName: "",
  fatherRelationship: "FATHER",
  fatherOccupation: "",
  fatherPhone: "",
  fatherEmail: "",
  fatherAadhaarLast4: "",
  fatherIncome: "",

  motherName: "",
  motherOccupation: "",
  motherPhone: "",
  motherEmail: "",
  motherAadhaarLast4: "",

  emergencyName: "",
  emergencyPhone: "",
  address: "",
  cityArea: "",
  pincode: "",
  district: "",
};

type Values = typeof emptyValues;

const initialState: PublishEnrollmentState = {};

export function EnrollStudentForm({
  suggestedAdmissionNo,
  grades,
  sections,
  currentAcademicYear,
  routes,
}: {
  suggestedAdmissionNo: string;
  grades: Grade[];
  sections: Section[];
  currentAcademicYear: { id: string; name: string } | null;
  routes: RouteOption[];
}) {
  const [values, setValues] = useState<Values>(emptyValues);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [state, formAction, isPending] = useActionState(publishEnrollmentAction, initialState);

  // Existing-parent search (Task 2 fix) -- when set, that guardian's card
  // links this real account instead of always creating a new one.
  const [fatherExisting, setFatherExisting] = useState<ExistingParentHit | null>(null);
  const [motherExisting, setMotherExisting] = useState<ExistingParentHit | null>(null);

  // Real, admin-settable credentials for a NEW guardian's parent-app login --
  // kept as their own state, deliberately NOT part of `values` (never written
  // to the localStorage draft, so a plaintext password never sits in browser
  // storage). Blank means "auto-generate one at Publish", same as
  // CreateParentModal's own "Set password (optional)" field. Cleared/disabled
  // when an existing parent is picked, since that account already has one.
  const [fatherPassword, setFatherPassword] = useState("");
  const [motherPassword, setMotherPassword] = useState("");

  // Photographs picked during form-filling (before any real personId exists).
  // Held as real File objects for the "N of 3 uploaded" counter and local
  // preview -- the actual upload happens in publishEnrollmentAction once the
  // real student/guardian personIds exist (see that file's own comment).
  const [studentPhoto, setStudentPhoto] = useState<File | null>(null);
  const [fatherPhoto, setFatherPhoto] = useState<File | null>(null);
  const [motherPhoto, setMotherPhoto] = useState<File | null>(null);
  const photosPicked = [studentPhoto, fatherPhoto, motherPhoto].filter(Boolean).length;

  // Real, working document picks -- same deferred-upload sequencing as the
  // photos above: picked now, actually uploaded (POST /documents/upload,
  // ownerDomain PEOPLE, the same endpoint the student profile's own
  // CertificatesSection already uses) once Publish creates the real
  // student.id.
  const [aadhaarCopyDoc, setAadhaarCopyDoc] = useState<File | null>(null);
  const [transferCertificate, setTransferCertificate] = useState<File | null>(null);
  const [birthCertificate, setBirthCertificate] = useState<File | null>(null);

  // Load a previously saved draft from this browser only, once, on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) setValues((v) => ({ ...v, ...JSON.parse(raw) }));
    } catch {
      // Private window / blocked storage -- form just starts blank, no crash.
    }
  }, []);

  // A fresh Publish success clears the saved draft -- the admission is real now.
  useEffect(() => {
    if (state.success) {
      try {
        window.localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Best effort only.
      }
    }
  }, [state.success]);

  function set<K extends keyof Values>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
    };
  }

  function saveLocal(label: string) {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      setSaveStatus(`${label} to this browser at ${new Date().toLocaleTimeString()} — nothing is created on the server until you Publish.`);
    } catch {
      setSaveStatus("Couldn't save to this browser (storage may be blocked).");
    }
  }

  const sectionsForGrade = useMemo(
    () => sections.filter((s) => !values.gradeId || s.gradeId === values.gradeId),
    [sections, values.gradeId],
  );
  const stopsForRoute = useMemo(
    () => routes.find((r) => r.id === values.routeId)?.stops ?? [],
    [routes, values.routeId],
  );

  const showErr = Boolean(state.missing && state.missing.length > 0) && !state.success;
  const missingSet = new Set((state.missing ?? []).map((m) => m.toLowerCase()));

  if (state.success) {
    return <PublishedSuccess success={state.success} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Enroll students</h1>
          <p className="mt-1 max-w-[620px] text-sm text-text-muted">
            Admit a new student, map the class and bus, save guardian details and issue the parent login.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/students"
            className="rounded-[11px] bg-[#1e3a8a] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            ▤ All student records
          </Link>
          <button
            type="button"
            disabled
            title="Excel import isn't built yet -- shown for layout parity with the reference design only, not a working control."
            className="rounded-[11px] border border-border px-4 py-2.5 text-sm font-bold text-text-muted opacity-60"
          >
            Import from Excel
          </button>
          <button
            type="button"
            onClick={() => saveLocal("Saved as draft")}
            className="rounded-[11px] border border-border px-4 py-2.5 text-sm font-bold text-text hover:bg-field"
          >
            Save as draft
          </button>
          <button
            type="button"
            onClick={() => saveLocal("Saved")}
            className="rounded-[11px] border border-primary px-4 py-2.5 text-sm font-bold text-primary hover:bg-field"
          >
            Save
          </button>
          <button
            type="submit"
            form="enroll-student-form"
            disabled={isPending}
            className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,111,224,.25)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-[14px] border border-border bg-field px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">Status</p>
        <p className="mt-1 text-sm text-text-muted">
          Columns marked REQUIRED must be filled before the admission can be published. Save as draft / Save keep
          your progress in this browser only — Publish is the only step that creates the real student record and
          issues the parent login.
        </p>
        {saveStatus && <p className="mt-1.5 text-sm font-semibold text-primary">{saveStatus}</p>}
      </div>

      {state.error && (
        <div role="alert" className="mt-4 rounded-[14px] border border-critical-text bg-critical-bg px-4 py-3">
          <p className="text-sm font-bold text-critical-text">Cannot publish · compulsory columns are empty</p>
          <p className="mt-1 text-sm text-critical-text">{state.error}</p>
        </div>
      )}

      <form id="enroll-student-form" action={formAction} className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2.7fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <input type="hidden" name="academicYearId" value={currentAcademicYear?.id ?? ""} />

          <Card title="Student details" hint="As printed on the transfer certificate">
            <Field label="Admission no." value={suggestedAdmissionNo} auto />
            <input type="hidden" name="admissionNo" value={suggestedAdmissionNo} />
            <Field
              label="Full name"
              name="fullName"
              required
              missing={showErr && missingSet.has("full name")}
              value={values.fullName}
              onChange={set("fullName")}
            />
            <Field
              label="Date of admission"
              name="dateOfAdmission"
              type="date"
              required
              value={values.dateOfAdmission}
              onChange={set("dateOfAdmission")}
            />
            <Field
              label="Date of birth"
              name="dateOfBirth"
              type="date"
              required
              missing={showErr && missingSet.has("date of birth")}
              value={values.dateOfBirth}
              onChange={set("dateOfBirth")}
            />
            <SelectField
              label="Gender"
              name="gender"
              value={values.gender}
              onChange={set("gender")}
              options={[
                ["", "Select"],
                ["MALE", "Male"],
                ["FEMALE", "Female"],
                ["OTHER", "Other"],
                ["UNDISCLOSED", "Prefer not to say"],
              ]}
            />
            <Field label="Blood group" name="bloodGroup" placeholder="e.g. O+" value={values.bloodGroup} onChange={set("bloodGroup")} />
            <Field
              label="Aadhaar (last 4)"
              name="aadhaarLast4"
              placeholder="1234"
              maxLength={4}
              value={values.aadhaarLast4}
              onChange={set("aadhaarLast4")}
            />
            <Field label="Mother tongue" name="motherTongue" value={values.motherTongue} onChange={set("motherTongue")} />
            <Field label="Second language" name="secondLanguage" value={values.secondLanguage} onChange={set("secondLanguage")} />
            <Field label="Religion" name="religion" value={values.religion} onChange={set("religion")} />
            <SelectField
              label="Community"
              name="community"
              value={values.community}
              onChange={set("community")}
              options={[
                ["", "Select"],
                ["GENERAL", "General"],
                ["BC", "BC"],
                ["MBC", "MBC"],
                ["OBC", "OBC"],
                ["SC", "SC"],
                ["ST", "ST"],
                ["MINORITY", "Minority"],
              ]}
            />
            <Field label="Nationality" name="nationality" placeholder="e.g. Indian" value={values.nationality} onChange={set("nationality")} />
            <Field label="Admission quota" name="admissionQuota" placeholder="e.g. RTE quota" value={values.admissionQuota} onChange={set("admissionQuota")} />
            <Field label="Previous school" name="previousSchool" value={values.previousSchool} onChange={set("previousSchool")} />
            <DisabledField label="ID card issued on" reason="Issued from the ID Card module after enrollment (its own real id_card.issued_on) — not set here." />
          </Card>

          <Card title="Class mapping" hint="Writes into the class register and the bus list">
            <Field label="Academic year" value={currentAcademicYear?.name ?? "No current year set"} auto />
            <SelectField
              label="Standard"
              name="gradeId"
              required
              value={values.gradeId}
              onChange={(e) => {
                set("gradeId")(e);
                setValues((v) => ({ ...v, sectionId: "" }));
              }}
              options={[["", "Select"], ...grades.map((g) => [g.id, g.name] as [string, string])]}
            />
            <SelectField
              label="Section"
              name="sectionId"
              required
              missing={showErr && missingSet.has("section")}
              value={values.sectionId}
              onChange={set("sectionId")}
              options={[["", "Select"], ...sectionsForGrade.map((s) => [s.id, s.name] as [string, string])]}
            />
            <Field
              label="Roll no."
              name="rollNo"
              type="number"
              placeholder="Auto-assigned if left blank"
              value={values.rollNo}
              onChange={set("rollNo")}
            />
            <DisabledField label="House" reason="student_house exists (Sports module) but has no admin write endpoint yet." />
            <DisabledField label="Class teacher" reason="Class Advisor is a role_assignment row — no single-student assignment endpoint exists yet." />
            <DisabledField label="Classroom" reason="No physical room/classroom column exists anywhere in this schema." />
            <SelectField
              label="Residence"
              name="residence"
              value={values.residence}
              onChange={set("residence")}
              options={[
                ["DAY", "Day scholar"],
                ["HOSTELLER", "Hosteller"],
              ]}
            />
            <DisabledField label="Hostel block & room" reason="hostel_allocation is real, but bed-level picking needs the Hostel module's own allocation screen after enrollment." />
            <SelectField
              label="Bus route"
              name="routeId"
              value={values.routeId}
              onChange={(e) => {
                set("routeId")(e);
                setValues((v) => ({ ...v, routeStopId: "" }));
              }}
              options={[["", "None"], ...routes.map((r) => [r.id, r.label] as [string, string])]}
            />
            <SelectField
              label="Boarding stop"
              name="routeStopId"
              disabled={!values.routeId}
              value={values.routeStopId}
              onChange={set("routeStopId")}
              options={[["", values.routeId ? "Select" : "Choose a route first"], ...stopsForRoute.map((s) => [s.id, s.label] as [string, string])]}
            />
            <DisabledField label="Fee category" reason="student_fee_assignment exists, but no single-student assignment endpoint was found — assign from Finance." />
          </Card>

          <Card title="Father / guardian" hint="This contact receives the parent login">
            <input type="hidden" name="fatherPersonId" value={fatherExisting?.id ?? ""} />
            <div className="sm:col-span-2">
              <ExistingParentPicker disabled={isPending} onSelect={setFatherExisting} />
            </div>
            <Field
              label="Name"
              name="fatherName"
              required={!fatherExisting}
              readOnly={Boolean(fatherExisting)}
              missing={showErr && missingSet.has("father / guardian name")}
              value={fatherExisting ? `${fatherExisting.firstName} ${fatherExisting.lastName ?? ""}`.trim() : values.fatherName}
              onChange={set("fatherName")}
            />
            <SelectField
              label="Relationship"
              name="fatherRelationship"
              value={values.fatherRelationship}
              onChange={set("fatherRelationship")}
              options={[
                ["FATHER", "Father"],
                ["GUARDIAN", "Guardian"],
                ["GRANDPARENT", "Grandparent"],
                ["OTHER", "Other"],
              ]}
            />
            <Field label="Occupation" name="fatherOccupation" value={values.fatherOccupation} onChange={set("fatherOccupation")} />
            <Field
              label="Phone"
              name="fatherPhone"
              required={!fatherExisting}
              readOnly={Boolean(fatherExisting)}
              missing={showErr && missingSet.has("father / guardian phone")}
              placeholder="10 digits"
              value={fatherExisting ? (fatherExisting.mobile ?? "") : values.fatherPhone}
              onChange={set("fatherPhone")}
            />
            <Field
              label="Email"
              name="fatherEmail"
              type="email"
              readOnly={Boolean(fatherExisting)}
              value={fatherExisting ? (fatherExisting.email ?? "") : values.fatherEmail}
              onChange={set("fatherEmail")}
            />
            <Field label="Aadhaar (last 4)" name="fatherAadhaarLast4" maxLength={4} disabled={Boolean(fatherExisting)} value={values.fatherAadhaarLast4} onChange={set("fatherAadhaarLast4")} />
            <Field label="Annual income (₹)" name="fatherIncome" type="number" value={values.fatherIncome} onChange={set("fatherIncome")} />
            <Field
              label="Set password (optional)"
              name="fatherPassword"
              type="password"
              minLength={8}
              placeholder={fatherExisting ? "Account already exists" : "Leave blank to auto-generate one"}
              disabled={Boolean(fatherExisting)}
              value={fatherExisting ? "" : fatherPassword}
              onChange={(e) => setFatherPassword(e.target.value)}
            />
          </Card>

          <Card title="Mother" hint="">
            <input type="hidden" name="motherPersonId" value={motherExisting?.id ?? ""} />
            <div className="sm:col-span-2">
              <ExistingParentPicker disabled={isPending} onSelect={setMotherExisting} />
            </div>
            <Field
              label="Name"
              name="motherName"
              readOnly={Boolean(motherExisting)}
              value={motherExisting ? `${motherExisting.firstName} ${motherExisting.lastName ?? ""}`.trim() : values.motherName}
              onChange={set("motherName")}
            />
            <Field label="Occupation" name="motherOccupation" value={values.motherOccupation} onChange={set("motherOccupation")} />
            <Field
              label="Phone"
              name="motherPhone"
              placeholder="10 digits"
              readOnly={Boolean(motherExisting)}
              value={motherExisting ? (motherExisting.mobile ?? "") : values.motherPhone}
              onChange={set("motherPhone")}
            />
            <Field
              label="Email"
              name="motherEmail"
              type="email"
              readOnly={Boolean(motherExisting)}
              value={motherExisting ? (motherExisting.email ?? "") : values.motherEmail}
              onChange={set("motherEmail")}
            />
            <Field label="Aadhaar (last 4)" name="motherAadhaarLast4" maxLength={4} disabled={Boolean(motherExisting)} value={values.motherAadhaarLast4} onChange={set("motherAadhaarLast4")} />
            <Field
              label="Set password (optional)"
              name="motherPassword"
              type="password"
              minLength={8}
              placeholder={motherExisting ? "Account already exists" : "Leave blank to auto-generate one"}
              disabled={Boolean(motherExisting)}
              value={motherExisting ? "" : motherPassword}
              onChange={(e) => setMotherPassword(e.target.value)}
            />
          </Card>

          <Card title="Emergency & address" hint="">
            <Field label="Emergency contact" name="emergencyName" placeholder="Name · relation" value={values.emergencyName} onChange={set("emergencyName")} />
            <Field label="Emergency phone" name="emergencyPhone" value={values.emergencyPhone} onChange={set("emergencyPhone")} />
            <Field label="Address" name="address" value={values.address} onChange={set("address")} />
            <Field label="City / area" name="cityArea" value={values.cityArea} onChange={set("cityArea")} />
            <Field label="Pincode" name="pincode" value={values.pincode} onChange={set("pincode")} />
            <Field label="District" name="district" value={values.district} onChange={set("district")} />
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Photographs" hint={`${photosPicked} of 3 uploaded`}>
            <p className="text-[13px] text-text-muted">
              Upload the student and guardian photographs. These print on the ID card and appear on the student
              profile.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2.5">
              <PhotoDropzone
                name="studentPhoto"
                label="Student photograph"
                hint="35 × 45 mm · JPG"
                file={studentPhoto}
                onFile={setStudentPhoto}
              />
              <PhotoDropzone
                name="fatherPhoto"
                label="Father / guardian photo"
                hint="JPG or PNG"
                file={fatherPhoto}
                onFile={setFatherPhoto}
              />
              <PhotoDropzone
                name="motherPhoto"
                label="Mother photo"
                hint="JPG or PNG"
                file={motherPhoto}
                onFile={setMotherPhoto}
              />
            </div>
            <div className="mt-3 flex flex-col divide-y divide-border border-t border-border">
              <AttachRow name="aadhaarCopyDoc" label="Aadhaar copy" file={aadhaarCopyDoc} onFile={setAadhaarCopyDoc} />
              <AttachRow name="transferCertificate" label="Transfer certificate" file={transferCertificate} onFile={setTransferCertificate} />
              <AttachRow name="birthCertificate" label="Birth certificate" file={birthCertificate} onFile={setBirthCertificate} />
            </div>
          </Card>

          <Card title="Parent login" hint="">
            <p className="text-[13px] text-text-muted">
              Each guardian entered above gets their own real login. There is no single shared "admission number as
              username" login in this app's real schema — logins are per person, by phone/email — so the username
              below is whichever contact you enter for that guardian. A temporary password is generated (or the one
              you set above) and shown once, right here, when you Publish.
            </p>
            <div className="mt-3 flex flex-col gap-2.5">
              {values.fatherName || fatherExisting ? (
                <div className="rounded-[11px] border border-border bg-field px-3.5 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-text-muted">Father / guardian username</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-text">
                    {fatherExisting ? fatherExisting.mobile || fatherExisting.email || "—" : values.fatherPhone || values.fatherEmail || "Enter a phone or email above"}
                  </p>
                </div>
              ) : null}
              {values.motherName || motherExisting ? (
                <div className="rounded-[11px] border border-border bg-field px-3.5 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-text-muted">Mother username</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-text">
                    {motherExisting ? motherExisting.mobile || motherExisting.email || "—" : values.motherPhone || values.motherEmail || "Enter a phone or email above"}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Delivery</span>
                <span className="font-semibold text-text">SMS + email</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Access</span>
                <span className="font-semibold text-text">Parent app</span>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}

function PublishedSuccess({
  success,
}: {
  success: NonNullable<PublishEnrollmentState["success"]>;
}) {
  return (
    <div className="mx-auto max-w-[640px] py-10">
      <div className="card-hover rounded-[16px] border border-border bg-surface p-[18px]">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Admission published · parent login created</p>
        <p className="mt-1.5 text-sm text-text-muted">
          Admission no. <span className="font-mono font-semibold text-text">{success.admissionNo}</span> is now a
          real ACTIVE student record.
        </p>

        {success.credentials.length === 0 && (
          <p className="mt-4 rounded-[11px] bg-field px-3.5 py-2.5 text-sm text-text-muted">
            No guardian login was issued — no guardian had a phone or email on file.
          </p>
        )}
        {success.credentials.map((c) => (
          <div key={c.label} className="mt-4 rounded-[11px] border border-border bg-field px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-bold text-text">{c.label}</p>
              {c.personId && (
                <Link href={`/admin/parents/${c.personId}`} className="shrink-0 text-xs font-bold text-primary hover:underline">
                  View parent profile →
                </Link>
              )}
            </div>
            <p className="mt-1 text-xs text-text-muted">
              This is the only time the temporary password is shown — share it with them now.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-text-muted">Username</p>
                <p className="font-mono text-sm font-semibold text-text">{c.username}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-text-muted">Temp password</p>
                <p className="font-mono text-sm font-semibold text-text">{c.temporaryPassword}</p>
              </div>
            </div>
          </div>
        ))}

        {success.warnings.length > 0 && (
          <div className="mt-4 rounded-[11px] border border-critical-text bg-critical-bg px-3.5 py-2.5">
            <p className="text-sm font-bold text-critical-text">Finish these manually from the profile</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-critical-text">
              {success.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <Link
            href={`/admin/students/${success.studentId}`}
            className="flex-1 rounded-[11px] bg-primary px-4 py-2.5 text-center text-sm font-bold text-white hover:opacity-90"
          >
            Go to profile — add photos & documents
          </Link>
          <Link
            href="/admin/students"
            className="rounded-[11px] border border-border px-4 py-2.5 text-sm font-bold text-text hover:bg-bg"
          >
            All students
          </Link>
        </div>
      </div>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="card-hover rounded-[16px] border border-border bg-surface p-[18px]">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">{title}</h2>
        {hint && <span className="text-xs text-text-muted">{hint}</span>}
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

/** Real, working photo picker -- a plain uncontrolled `<input type="file">`
 * (name attribute matches the FormData key publishEnrollmentAction reads),
 * with an immediate local preview via URL.createObjectURL and the File kept
 * in the parent's own React state (for the "N of 3 uploaded" counter). No
 * upload happens here -- nothing has a real personId yet. The actual upload
 * happens server-side in publishEnrollmentAction, once the student/guardian
 * rows (and their real personIds) exist. */
function PhotoDropzone({
  name,
  label,
  hint,
  file,
  onFile,
}: {
  name: string;
  label: string;
  hint: string;
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-[11px] border border-dashed border-border bg-field px-3 py-3 transition-colors hover:bg-bg">
      <input
        type="file"
        name={name}
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob: preview of a just-picked file, not backend-hosted
        <img src={preview} alt={label} className="h-11 w-11 shrink-0 rounded-full border border-border object-cover" />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-lg text-text-muted">
          ↑
        </span>
      )}
      <span className="flex-1 text-left">
        <span className="block text-[13px] font-semibold text-text">{label}</span>
        <span className="block text-xs text-text-muted">{file ? file.name : hint}</span>
      </span>
    </label>
  );
}

/** Real, working single-document "Attach" row -- clicking the label opens a
 * real file picker; once chosen, shows the filename and a "Remove" option
 * instead of the empty "Attach" link. Nothing uploads until Publish, when it
 * goes through the same real POST /documents/upload the student profile's
 * own CertificatesSection uses. */
function AttachRow({
  name,
  label,
  file,
  onFile,
}: {
  name: string;
  label: string;
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-text">{label}</span>
      {file ? (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs text-text-muted">{file.name}</span>
          <button type="button" onClick={() => onFile(null)} className="shrink-0 text-xs font-semibold text-critical-text">
            Remove
          </button>
        </span>
      ) : (
        <label className="shrink-0 cursor-pointer text-sm font-bold text-primary hover:underline">
          Attach
          <input
            type="file"
            name={name}
            accept="application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  missing,
  auto,
  disabled,
  readOnly,
  placeholder,
  maxLength,
  minLength,
  value,
  onChange,
}: {
  label: string;
  name?: string;
  type?: string;
  required?: boolean;
  missing?: boolean;
  auto?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-text">
        {label}
        {required && <span className="text-critical-text"> *</span>}
        {auto && (
          <span className="ml-1.5 rounded-[5px] bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] text-primary">
            Auto
          </span>
        )}
      </span>
      {auto ? (
        <div className="rounded-[11px] border border-primary/30 bg-primary/5 px-3.5 py-2.5 font-mono text-[13px] font-semibold text-primary">
          {value}
        </div>
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          maxLength={maxLength}
          minLength={minLength}
          value={value}
          onChange={onChange}
          className={`rounded-[11px] border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60 read-only:opacity-60 ${
            missing ? "border-critical-text bg-critical-bg" : "border-border"
          }`}
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  name,
  required,
  missing,
  disabled,
  value,
  onChange,
  options,
}: {
  label: string;
  name: string;
  required?: boolean;
  missing?: boolean;
  disabled?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-text">
        {label}
        {required && <span className="text-critical-text"> *</span>}
      </span>
      <select
        name={name}
        required={required}
        disabled={disabled}
        value={value}
        onChange={onChange}
        className={`rounded-[11px] border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60 ${
          missing ? "border-critical-text bg-critical-bg" : "border-border"
        }`}
      >
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function DisabledField({ label, reason }: { label: string; reason: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-text-muted">{label}</span>
      <div
        title={reason}
        className="rounded-[11px] border border-dashed border-border bg-field px-3.5 py-2.5 text-[13px] text-text-muted opacity-70"
      >
        Not tracked here
      </div>
      <span className="text-xs text-text-muted">{reason}</span>
    </label>
  );
}
