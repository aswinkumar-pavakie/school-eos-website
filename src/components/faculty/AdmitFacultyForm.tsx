"use client";

// Admit faculty -- pixel-matched to SIS ADMIN's reference "Admit faculty"
// screen (Admin Portal.dc.html: facReq/draftFaculty/saveFacultyRec/
// publishFaculty), rebuilt with REAL backend calls. Every field below is
// either:
//   (a) an existing real column, reused as-is (Full name/DOB/gender/
//       designation/joining date/experience years[=person+staff], Official
//       email/Phone number[=person.email+person.mobile via the same
//       two-step POST /persons + PATCH createFacultyAction's replacement,
//       publishFacultyAction, already uses], Residential address/district/
//       Aadhaar last 4[=person]), or
//   (b) a genuinely new column added via query.md (Department/School-campus
//       [=real FK onto the pre-existing department/campus tables], Blood
//       group, Employment type, Staff room, Emergency contact, academic
//       credentials [highest qualification/specialization/university/year
//       of graduation/TET-NET], professional info [areas of expertise/
//       certifications/workshops/achievements] -- see query.md's "Admit
//       Faculty page" section for the exact DDL), or
//   (c) honestly disabled with a one-line reason when this schema has no
//       real backing for it yet, or the reference design's own note already
//       says it's assigned later (Subjects/Classes handled, Class teacher
//       of, Periods per week, Grade band -- all real, but derived from
//       subject_offering/role_assignment after Publish, from Academics, not
//       raw input here -- matches the reference's own "Optional at publish
//       · fill after classes are assigned").
//
// Employee ID is suggested (GET /staff/next-employee-id, same pattern as
// Students' next-admission-no) but stays a free-text, editable field --
// employee_no has no format constraint in the schema beyond uniqueness.
//
// Photograph and document uploads (staff photo, qualification certificates,
// Aadhaar copy, experience letter, police verification) need a real
// personId/staffId to upload against (PersonPhotoEditor / CertificatesSection
// both do), which doesn't exist until Publish actually creates the record --
// so those controls stay disabled here with an "available after Publish"
// note, same as Enroll Students, and the success state links straight to the
// new faculty profile, where both already exist and work.
//
// Save as draft / Save: there is no DRAFT status in the `staff` table's own
// CHECK constraint (only ACTIVE/ON_LEAVE/EXITED are allowed), so these two
// buttons are real `localStorage` persistence only -- nothing is sent to the
// backend until Publish. Stated in the UI, not hidden.

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { publishFacultyAction, type PublishFacultyState } from "@/app/(dashboard)/admin/faculty/actions";

const DRAFT_KEY = "admitFacultyDraft:v1";

interface Department {
  id: string;
  name: string;
}
interface Campus {
  id: string;
  name: string;
}
interface RosterEntry {
  id: string;
  name: string;
  employeeNo: string;
  designation: string | null;
}

const emptyValues = {
  fullName: "",
  designation: "",
  departmentId: "",
  gender: "",
  dateOfBirth: "",
  bloodGroup: "",
  aadhaarLast4: "",
  experienceYears: "",
  dateOfJoining: new Date().toISOString().slice(0, 10),
  employmentType: "",

  officialEmail: "",
  phoneNumber: "",
  campusId: "",
  staffRoom: "",
  address: "",
  district: "",
  emergencyContactName: "",
  emergencyContactPhone: "",

  highestQualification: "",
  specialization: "",
  university: "",
  yearOfGraduation: "",

  areasOfExpertise: "",
  certifications: "",
  workshopsTraining: "",
  achievementsAwards: "",

  temporaryPassword: "",
  confirmPassword: "",
};

type Values = typeof emptyValues;

const initialState: PublishFacultyState = {};

export function AdmitFacultyForm({
  suggestedEmployeeNo,
  departments,
  campuses,
  currentAcademicYear,
  roster,
  rosterError,
}: {
  suggestedEmployeeNo: string;
  departments: Department[];
  campuses: Campus[];
  currentAcademicYear: { id: string; name: string } | null;
  roster: RosterEntry[];
  rosterError?: boolean;
}) {
  const [values, setValues] = useState<Values>(emptyValues);
  const [isTeaching, setIsTeaching] = useState(true);
  const [tetNetCleared, setTetNetCleared] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [state, formAction, isPending] = useActionState(publishFacultyAction, initialState);

  // Staff photograph picked during form-filling -- real File object kept in
  // state for local preview / the "1 of 1 uploaded" counter, uploaded
  // server-side once Publish creates the real personId (see faculty/actions.ts).
  const [staffPhoto, setStaffPhoto] = useState<File | null>(null);
  // Real, working document picks -- same deferred-upload sequencing as
  // staffPhoto above: picked now (held as real File objects, immediately
  // reflected in the "N uploaded" counters), actually uploaded to the real
  // documents module (POST /documents/upload, ownerDomain PEOPLE, the same
  // endpoint the faculty profile's own CertificatesSection already uses) the
  // moment Publish creates the real staff/personId. Reuses that exact real
  // endpoint -- not a new upload path.
  const [qualificationCertificates, setQualificationCertificates] = useState<File[]>([]);
  const [aadhaarCopy, setAadhaarCopy] = useState<File | null>(null);
  const [experienceLetter, setExperienceLetter] = useState<File | null>(null);
  const [policeVerification, setPoliceVerification] = useState<File | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) setValues((v) => ({ ...v, ...JSON.parse(raw) }));
    } catch {
      // Private window / blocked storage -- form just starts blank, no crash.
    }
  }, []);

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

  const showErr = Boolean(state.missing && state.missing.length > 0) && !state.success;
  const missingSet = useMemo(() => new Set((state.missing ?? []).map((m) => m.toLowerCase())), [state.missing]);

  if (state.success) {
    return <PublishedSuccess success={state.success} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Admit faculty</h1>
          <p className="mt-1 max-w-[640px] text-sm text-text-muted">
            Fill the compulsory columns to publish a new teacher. Classes and teaching details are assigned later,
            and the profile is completed from faculty records.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/faculty"
            className="rounded-[11px] bg-[#1e3a8a] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
          >
            ☰ All faculty records
          </Link>
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
            form="admit-faculty-form"
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
          Only the REQUIRED columns block publishing. Everything else can be left blank for now. Save as draft /
          Save keep your progress in this browser only — Publish is the only step that creates the real staff
          record and issues the teacher app login.
        </p>
        {saveStatus && <p className="mt-1.5 text-sm font-semibold text-primary">{saveStatus}</p>}
      </div>

      {state.error && (
        <div role="alert" className="mt-4 rounded-[14px] border border-critical-text bg-critical-bg px-4 py-3">
          <p className="text-sm font-bold text-critical-text">Cannot publish · compulsory columns are empty</p>
          <p className="mt-1 text-sm text-critical-text">{state.error}</p>
        </div>
      )}

      <form
        id="admit-faculty-form"
        action={formAction}
        className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2.7fr)_minmax(0,1fr)] lg:items-start"
      >
        <div className="flex flex-col gap-4">
          <Card title="Profile" hint="As printed on the staff ID card">
            <Field label="Employee ID" value={suggestedEmployeeNo} auto />
            <input type="hidden" name="employeeNo" value={suggestedEmployeeNo} />
            <Field
              label="Full name"
              name="fullName"
              required
              missing={showErr && missingSet.has("full name")}
              value={values.fullName}
              onChange={set("fullName")}
            />
            <Field
              label="Designation"
              name="designation"
              required
              placeholder="e.g. Tamil Teacher"
              missing={showErr && missingSet.has("designation")}
              value={values.designation}
              onChange={set("designation")}
            />
            <SelectField
              label="Department"
              name="departmentId"
              required
              missing={showErr && missingSet.has("department")}
              value={values.departmentId}
              onChange={set("departmentId")}
              options={[["", "Select"], ...departments.map((d) => [d.id, d.name] as [string, string])]}
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
            <Field label="Date of birth" name="dateOfBirth" type="date" value={values.dateOfBirth} onChange={set("dateOfBirth")} />
            <Field label="Blood group" name="bloodGroup" placeholder="e.g. O+" value={values.bloodGroup} onChange={set("bloodGroup")} />
            <Field
              label="Aadhaar (last 4)"
              name="aadhaarLast4"
              placeholder="1234"
              maxLength={4}
              value={values.aadhaarLast4}
              onChange={set("aadhaarLast4")}
            />
            <Field
              label="Experience (years)"
              name="experienceYears"
              type="number"
              placeholder="After reviewing certificates"
              value={values.experienceYears}
              onChange={set("experienceYears")}
            />
            <Field
              label="Joining date"
              name="dateOfJoining"
              type="date"
              required
              missing={showErr && missingSet.has("joining date")}
              value={values.dateOfJoining}
              onChange={set("dateOfJoining")}
            />
            <SelectField
              label="Employment type"
              name="employmentType"
              value={values.employmentType}
              onChange={set("employmentType")}
              options={[
                ["", "Select"],
                ["PERMANENT", "Permanent"],
                ["CONTRACT", "Contract"],
                ["PART_TIME", "Part-time"],
                ["PROBATION", "Probation"],
                ["VISITING", "Visiting"],
              ]}
            />
            <Field label="Academic year" value={currentAcademicYear?.name ?? "No current year set"} auto />
            <label className="flex items-center gap-2 text-[13px] text-text">
              <input
                type="checkbox"
                name="isTeaching"
                checked={isTeaching}
                onChange={(e) => setIsTeaching(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Teaching staff
            </label>
          </Card>

          <Card title="Contact" hint="Official email becomes the app username">
            <Field
              label="Official email"
              name="officialEmail"
              type="email"
              required
              missing={showErr && missingSet.has("official email")}
              value={values.officialEmail}
              onChange={set("officialEmail")}
            />
            <Field
              label="Phone number"
              name="phoneNumber"
              placeholder="10 digits"
              required
              missing={showErr && missingSet.has("phone number")}
              value={values.phoneNumber}
              onChange={set("phoneNumber")}
            />
            <SelectField
              label="School / campus"
              name="campusId"
              value={values.campusId}
              onChange={set("campusId")}
              options={[["", "Select"], ...campuses.map((c) => [c.id, c.name] as [string, string])]}
            />
            <Field label="Staff room" name="staffRoom" value={values.staffRoom} onChange={set("staffRoom")} />
            <Field label="Residential address" name="address" value={values.address} onChange={set("address")} />
            <Field label="District" name="district" value={values.district} onChange={set("district")} />
            <Field
              label="Emergency contact name"
              name="emergencyContactName"
              value={values.emergencyContactName}
              onChange={set("emergencyContactName")}
            />
            <Field
              label="Emergency contact phone"
              name="emergencyContactPhone"
              value={values.emergencyContactPhone}
              onChange={set("emergencyContactPhone")}
            />
          </Card>

          <Card title="Academic details" hint="Certificates verified at joining">
            <Field
              label="Highest qualification"
              name="highestQualification"
              placeholder="e.g. M.A., B.Ed."
              value={values.highestQualification}
              onChange={set("highestQualification")}
            />
            <Field label="Specialization" name="specialization" value={values.specialization} onChange={set("specialization")} />
            <Field label="University" name="university" value={values.university} onChange={set("university")} />
            <Field
              label="Year of graduation"
              name="yearOfGraduation"
              type="number"
              placeholder="e.g. 2015"
              value={values.yearOfGraduation}
              onChange={set("yearOfGraduation")}
            />
            <label className="flex items-center gap-2 text-[13px] text-text">
              <input
                type="checkbox"
                name="tetNetCleared"
                checked={tetNetCleared}
                onChange={(e) => setTetNetCleared(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              TET / NET cleared
            </label>
          </Card>

          <Card title="Teaching details" hint="Optional at publish · fill after classes are assigned">
            <DisabledField
              label="Subjects handled"
              reason="Real data (subject_offering.teacher_staff_id) — assigned from the profile's Subjects section once this record is published, not entered here."
            />
            <DisabledField
              label="Classes handled"
              reason="Derived from the same subject_offering rows above — populates automatically once subjects are assigned."
            />
            <DisabledField
              label="Class teacher of"
              reason="Class Advisor is a role_assignment row, assigned per-section from Academics — no single-teacher field to set at creation."
            />
            <DisabledField
              label="Periods per week"
              reason="Computed from the timetable once subject offerings are assigned — not a raw input."
            />
            <DisabledField
              label="Grade band"
              reason="Derived from the stage/standard of whichever subjects/sections are eventually assigned."
            />
          </Card>

          <Card title="Professional information" hint="">
            <Field
              label="Areas of expertise"
              name="areasOfExpertise"
              placeholder="Comma-separated"
              value={values.areasOfExpertise}
              onChange={set("areasOfExpertise")}
            />
            <Field label="Certifications" name="certifications" placeholder="Comma-separated" value={values.certifications} onChange={set("certifications")} />
            <Field
              label="Workshops / training"
              name="workshopsTraining"
              placeholder="Comma-separated"
              value={values.workshopsTraining}
              onChange={set("workshopsTraining")}
            />
            <Field
              label="Achievements & awards"
              name="achievementsAwards"
              placeholder="Comma-separated"
              value={values.achievementsAwards}
              onChange={set("achievementsAwards")}
            />
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card title="Photograph & documents" hint={`Employee ID ${suggestedEmployeeNo}`}>
            <div className="flex flex-col sm:col-span-2">
              <p className="text-[13px] text-text-muted">
                The staff photograph appears on the teacher profile and the ID card. Certificates are verified before
                the record is activated.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2.5">
                <PhotoDropzone name="staffPhoto" label="Staff photograph" hint="35 × 45 mm · JPG" file={staffPhoto} onFile={setStaffPhoto} />
                <MultiFileDropzone
                  name="qualificationCertificates"
                  label="Qualification certificates"
                  hint="PDF · multiple"
                  files={qualificationCertificates}
                  onFiles={setQualificationCertificates}
                />
              </div>
              <div className="mt-3 flex flex-col divide-y divide-border border-t border-border">
                <AttachRow name="aadhaarCopy" label="Aadhaar copy" file={aadhaarCopy} onFile={setAadhaarCopy} />
                <AttachRow name="experienceLetter" label="Experience letter" file={experienceLetter} onFile={setExperienceLetter} />
                <AttachRow name="policeVerification" label="Police verification" file={policeVerification} onFile={setPoliceVerification} />
              </div>
            </div>
          </Card>

          <Card title="Teacher app login" hint="">
            <p className="text-[13px] text-text-muted">
              Credentials for this teacher&apos;s app. The official email is the username and the password must be
              changed at first sign-in.
            </p>
            <div className="flex flex-col gap-3.5 sm:col-span-2">
              <Field label="Username" value={values.officialEmail || "(official email above)"} auto />
              <Field
                label="Temporary password (optional)"
                name="temporaryPassword"
                placeholder="Leave blank to auto-generate one"
                minLength={8}
                value={values.temporaryPassword}
                onChange={set("temporaryPassword")}
              />
              <Field
                label="Confirm password"
                name="confirmPassword"
                placeholder="Repeat the password above"
                value={values.confirmPassword}
                onChange={set("confirmPassword")}
              />
            </div>
            <div className="mt-1 flex flex-col gap-1.5 border-t border-border pt-3 text-sm sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Delivery</span>
                <span className="font-semibold text-text">SMS + email</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Access</span>
                <span className="font-semibold text-text">Teacher app · own classes</span>
              </div>
            </div>
          </Card>

          <Card title="Faculty on roll" hint={rosterError ? "Couldn't load" : `${roster.length} shown`}>
            {rosterError ? (
              <p className="text-[13px] text-critical-text sm:col-span-2">
                Couldn&apos;t load the active faculty list right now — this is a loading error, not confirmation
                that none exist. Refresh the page to retry.
              </p>
            ) : roster.length === 0 ? (
              <p className="text-[13px] text-text-muted sm:col-span-2">No active faculty on file yet.</p>
            ) : (
              <div className="flex flex-col gap-2 sm:col-span-2">
                {roster.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-[11px] bg-field px-3 py-2 text-sm">
                    <div>
                      <p className="font-semibold text-text">{r.name}</p>
                      <p className="text-xs text-text-muted">{r.designation ?? "—"}</p>
                    </div>
                    <span className="font-mono text-xs text-text-muted">{r.employeeNo}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </form>
    </div>
  );
}

function PublishedSuccess({
  success,
}: {
  success: NonNullable<PublishFacultyState["success"]>;
}) {
  return (
    <div className="mx-auto max-w-[640px] py-10">
      <div className="card-hover rounded-[16px] border border-border bg-surface p-[18px]">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Faculty published · app login created</p>
        <p className="mt-1.5 text-sm text-text-muted">
          Employee ID <span className="font-mono font-semibold text-text">{success.employeeNo}</span> is now a real
          ACTIVE staff record.
        </p>

        <div className="mt-4 rounded-[11px] border border-border bg-field px-3.5 py-2.5">
          <p className="text-[13px] font-bold text-text">Teacher app login</p>
          <p className="mt-1 text-xs text-text-muted">
            This is the only time the temporary password is shown — share it with them now.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-text-muted">Username</p>
              <p className="font-mono text-sm font-semibold text-text">{success.username}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-text-muted">Temp password</p>
              <p className="font-mono text-sm font-semibold text-text">{success.temporaryPassword}</p>
            </div>
          </div>
        </div>

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
            href={`/admin/faculty/${success.staffId}`}
            className="flex-1 rounded-[11px] bg-primary px-4 py-2.5 text-center text-sm font-bold text-white hover:opacity-90"
          >
            Go to profile — add photo & documents
          </Link>
          <Link
            href="/admin/faculty"
            className="rounded-[11px] border border-border px-4 py-2.5 text-sm font-bold text-text hover:bg-bg"
          >
            All faculty
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

/** Real, working multi-file picker (Qualification certificates) -- same
 * deferred-upload shape as PhotoDropzone below, but accepts several files at
 * once and lists each by name instead of a single preview. */
function MultiFileDropzone({
  name,
  label,
  hint,
  files,
  onFiles,
}: {
  name: string;
  label: string;
  hint: string;
  files: File[];
  onFiles: (files: File[]) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[11px] border-[1.5px] border-dashed border-[#c3d3ea] bg-[#f9fbfe] px-3 py-5 text-center transition-colors hover:border-primary hover:bg-[#f4f9ff]">
      <input
        type="file"
        name={name}
        accept="application/pdf,image/jpeg,image/png"
        multiple
        className="hidden"
        onChange={(e) => onFiles(Array.from(e.target.files ?? []))}
      />
      <span className="text-xl text-primary">⬆</span>
      <span className="text-[13.5px] font-bold text-[#1e3a8a]">{label}</span>
      <span className="font-mono text-[11.5px] text-text-muted">
        {files.length > 0 ? `${files.length} file${files.length === 1 ? "" : "s"} chosen` : hint}
      </span>
      {files.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="max-w-[200px] truncate text-xs text-text-muted">
              {f.name}
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}

/** Real, working single-document "Attach" row -- clicking the label opens a
 * real file picker; once chosen, shows the filename and a "Remove" option
 * instead of the empty "Attach" link. Same deferred-upload sequencing as
 * PhotoDropzone/MultiFileDropzone -- nothing uploads until Publish, when it
 * goes through the same real POST /documents/upload the profile's own
 * CertificatesSection uses. */
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

/** Real, working photo picker -- same shape as EnrollStudentForm's own
 * PhotoDropzone (uncontrolled `<input type="file">` whose `name` matches the
 * FormData key publishFacultyAction reads, immediate local preview via
 * URL.createObjectURL). No upload happens client-side -- nothing has a real
 * personId until Publish actually creates the person row. */
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
    <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[11px] border-[1.5px] border-dashed border-[#c3d3ea] bg-[#f9fbfe] px-3 py-5 text-center transition-colors hover:border-primary hover:bg-[#f4f9ff]">
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
        <span className="text-xl text-primary">⬆</span>
      )}
      <span className="text-[13.5px] font-bold text-[#1e3a8a]">{label}</span>
      <span className="font-mono text-[11.5px] text-text-muted">{file ? file.name : hint}</span>
    </label>
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
          placeholder={placeholder}
          maxLength={maxLength}
          minLength={minLength}
          value={value}
          onChange={onChange}
          className={`rounded-[11px] border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60 ${
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
