"use client";

// Create-student modal -- Design Architecture v0.1 component 13 (Modal, 480px web,
// same field rhythm as the mobile bottom sheet). Two-column field layout per
// reference-img/admission-student.png, our own field set and tokens. Widened to
// 760px (was 480px) and given a 3-column grid at this width so fields like
// City/State/Pincode and the Enrolment details row below get real room instead
// of three squeezed inputs in a 480px-wide sheet.
//
// Enrolment details (type, remarks) are real, already-supported fields on
// CreateEnrolmentDto (school-eos-backend's create-enrolment.dto.ts:
// enrolmentType one of REGULAR/PROMOTED/DETAINED/READMITTED/TRANSFER_IN,
// remarks a free-text string) that createStudentAction's own POST
// /students/:id/enrolments call was never sending -- not invented fields, an
// existing capability this modal just didn't expose yet. Both are optional
// (enrolmentType defaults to REGULAR at the DB level, remarks may be blank).
//
// Class itself is REQUIRED, not optional -- every admission must be enrolled
// into a section immediately (see createStudentAction's own guard, checked
// server-side too since a server action can be invoked directly and must not
// rely on this <select required> alone).
//
// Fields are controlled (value/onChange into a local `values` object) rather
// than plain uncontrolled inputs -- a Server Action's own <form action=...>
// submission resets uncontrolled fields once the action completes, even on
// failure, which was wiping every field the admin had already typed just
// because one field failed validation. Controlled inputs aren't touched by
// that reset, so a failed submission only shows an inline error under the
// specific bad field (fieldErrors, from the backend's own per-property
// validation messages -- see lib/form-errors.ts) while everything else stays
// exactly as typed.

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createStudentAction,
  getNextAdmissionNoAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/students/actions";

const initialState: FormActionState = {};

interface Grade {
  id: string;
  name: string;
}

interface Section {
  id: string;
  gradeId: string;
  name: string;
}

const emptyValues = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  mobile: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  admissionNo: "",
  admissionDate: "",
  sectionId: "",
  rollNo: "",
  enrolmentType: "",
  enrolmentRemarks: "",
  stateStudentId: "",
  bloodGroup: "",
  motherTongue: "",
  communityCategory: "",
};

const emptyChecks = {
  isFirstGenLearner: false,
  isDifferentlyAbled: false,
  isHosteller: false,
  usesSchoolTransport: false,
};

export function CreateStudentModal({ grades, sections }: { grades: Grade[]; sections: Section[] }) {
  const [open, setOpen] = useState(false);
  const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false);
  const [values, setValues] = useState(emptyValues);
  const [checks, setChecks] = useState(emptyChecks);
  const [suggestedAdmissionNo, setSuggestedAdmissionNo] = useState(false);
  const [state, formAction, isPending] = useActionState(createStudentAction, initialState);
  const fieldErrors = state.fieldErrors ?? {};
  const gradeById = new Map(grades.map((g) => [g.id, g.name]));

  function handleChange(name: keyof typeof emptyValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
    };
  }

  function handleCheck(name: keyof typeof emptyChecks) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setChecks((c) => ({ ...c, [name]: e.target.checked }));
    };
  }

  async function handleOpen() {
    setIsFetchingSuggestion(true);
    const suggestion = await getNextAdmissionNoAction();
    if (suggestion) {
      setValues((v) => ({ ...v, admissionNo: suggestion }));
      setSuggestedAdmissionNo(true);
    }
    setIsFetchingSuggestion(false);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setValues(emptyValues);
    setChecks(emptyChecks);
    setSuggestedAdmissionNo(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={isFetchingSuggestion}
        className="flex items-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,111,224,.25)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isFetchingSuggestion ? "Loading…" : "+ New admission"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#101828]/45 px-4 py-10">
          <div className="w-full max-w-[760px] rounded-[16px] bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">New admission</h2>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg"
              >
                ×
              </button>
            </div>

            {state.error && (
              <div
                role="alert"
                className="mt-4 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm font-medium text-critical-text"
              >
                <p>{state.error}</p>
                {state.studentId && (
                  <Link
                    href={`/admin/students/${state.studentId}`}
                    className="mt-1.5 inline-block font-bold underline"
                  >
                    View the student record
                  </Link>
                )}
              </div>
            )}

            <form action={formAction} className="mt-4 flex flex-col gap-4" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="First name"
                  name="firstName"
                  required
                  disabled={isPending}
                  value={values.firstName}
                  onChange={handleChange("firstName")}
                  error={fieldErrors.firstName}
                />
                <Field
                  label="Last name"
                  name="lastName"
                  disabled={isPending}
                  value={values.lastName}
                  onChange={handleChange("lastName")}
                  error={fieldErrors.lastName}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Date of birth"
                  name="dateOfBirth"
                  type="date"
                  disabled={isPending}
                  value={values.dateOfBirth}
                  onChange={handleChange("dateOfBirth")}
                  error={fieldErrors.dateOfBirth}
                />
                <SelectField
                  label="Gender"
                  name="gender"
                  disabled={isPending}
                  value={values.gender}
                  onChange={handleChange("gender")}
                  error={fieldErrors.gender}
                  options={[
                    ["", "Select"],
                    ["MALE", "Male"],
                    ["FEMALE", "Female"],
                    ["OTHER", "Other"],
                    ["UNDISCLOSED", "Prefer not to say"],
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Mobile"
                  name="mobile"
                  placeholder="10 digits"
                  disabled={isPending}
                  value={values.mobile}
                  onChange={handleChange("mobile")}
                  error={fieldErrors.mobile}
                />
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  disabled={isPending}
                  value={values.email}
                  onChange={handleChange("email")}
                  error={fieldErrors.email}
                />
              </div>
              <p className="-mt-2 text-xs text-text-muted">At least one of mobile or email is required.</p>

              <Field
                label="Address line 1"
                name="addressLine1"
                required
                disabled={isPending}
                value={values.addressLine1}
                onChange={handleChange("addressLine1")}
                error={fieldErrors.addressLine1}
              />
              <Field
                label="Address line 2 (optional)"
                name="addressLine2"
                disabled={isPending}
                value={values.addressLine2}
                onChange={handleChange("addressLine2")}
                error={fieldErrors.addressLine2}
              />
              <div className="grid grid-cols-3 gap-4">
                <Field
                  label="City"
                  name="city"
                  required
                  disabled={isPending}
                  value={values.city}
                  onChange={handleChange("city")}
                  error={fieldErrors.city}
                />
                <Field
                  label="State"
                  name="state"
                  required
                  disabled={isPending}
                  value={values.state}
                  onChange={handleChange("state")}
                  error={fieldErrors.state}
                />
                <Field
                  label="Pincode"
                  name="pincode"
                  required
                  disabled={isPending}
                  placeholder="6 digits"
                  value={values.pincode}
                  onChange={handleChange("pincode")}
                  error={fieldErrors.pincode}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Admission no."
                  name="admissionNo"
                  required
                  disabled={isPending}
                  value={values.admissionNo}
                  onChange={handleChange("admissionNo")}
                  error={fieldErrors.admissionNo}
                />
                <Field
                  label="Admission date"
                  name="admissionDate"
                  type="date"
                  required
                  disabled={isPending}
                  value={values.admissionDate}
                  onChange={handleChange("admissionDate")}
                  error={fieldErrors.admissionDate}
                />
              </div>
              {suggestedAdmissionNo && (
                <p className="-mt-2 text-xs text-text-muted">
                  Suggested from the last admission this year — edit it if this student needs a different number.
                </p>
              )}

              <div className="grid grid-cols-3 gap-4">
                <SelectField
                  label="Class"
                  name="sectionId"
                  required
                  disabled={isPending}
                  value={values.sectionId}
                  onChange={handleChange("sectionId")}
                  error={fieldErrors.sectionId}
                  options={[
                    ["", "Select class"],
                    ...sections.map(
                      (s) => [s.id, `${gradeById.get(s.gradeId) ?? "—"} · ${s.name}`] as [string, string],
                    ),
                  ]}
                />
                <Field
                  label="Roll no."
                  name="rollNo"
                  type="number"
                  disabled={isPending}
                  placeholder="Auto-assigned if left blank"
                  value={values.rollNo}
                  onChange={handleChange("rollNo")}
                  error={fieldErrors.rollNo}
                />
                <SelectField
                  label="Enrolment type (optional)"
                  name="enrolmentType"
                  disabled={isPending}
                  value={values.enrolmentType}
                  onChange={handleChange("enrolmentType")}
                  error={fieldErrors.enrolmentType}
                  options={[
                    ["", "Regular (default)"],
                    ["PROMOTED", "Promoted"],
                    ["DETAINED", "Detained"],
                    ["READMITTED", "Readmitted"],
                    ["TRANSFER_IN", "Transfer in"],
                  ]}
                />
              </div>
              <Field
                label="Enrolment remarks (optional)"
                name="enrolmentRemarks"
                disabled={isPending}
                placeholder="e.g. Transferred from Sunrise Matric, Class VI"
                value={values.enrolmentRemarks}
                onChange={handleChange("enrolmentRemarks")}
                error={fieldErrors.enrolmentRemarks}
              />

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="State student ID"
                  name="stateStudentId"
                  disabled={isPending}
                  placeholder="e.g. TN2025034567"
                  value={values.stateStudentId}
                  onChange={handleChange("stateStudentId")}
                  error={fieldErrors.stateStudentId}
                />
                <Field
                  label="Blood group"
                  name="bloodGroup"
                  placeholder="e.g. O+"
                  disabled={isPending}
                  value={values.bloodGroup}
                  onChange={handleChange("bloodGroup")}
                  error={fieldErrors.bloodGroup}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Mother tongue"
                  name="motherTongue"
                  disabled={isPending}
                  value={values.motherTongue}
                  onChange={handleChange("motherTongue")}
                  error={fieldErrors.motherTongue}
                />
                <SelectField
                  label="Community category"
                  name="communityCategory"
                  disabled={isPending}
                  value={values.communityCategory}
                  onChange={handleChange("communityCategory")}
                  error={fieldErrors.communityCategory}
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
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <Checkbox
                  label="First-generation learner"
                  name="isFirstGenLearner"
                  disabled={isPending}
                  checked={checks.isFirstGenLearner}
                  onChange={handleCheck("isFirstGenLearner")}
                />
                <Checkbox
                  label="Differently abled"
                  name="isDifferentlyAbled"
                  disabled={isPending}
                  checked={checks.isDifferentlyAbled}
                  onChange={handleCheck("isDifferentlyAbled")}
                />
                <Checkbox
                  label="Hosteller"
                  name="isHosteller"
                  disabled={isPending}
                  checked={checks.isHosteller}
                  onChange={handleCheck("isHosteller")}
                />
                <Checkbox
                  label="Uses school transport"
                  name="usesSchoolTransport"
                  disabled={isPending}
                  checked={checks.usesSchoolTransport}
                  onChange={handleCheck("usesSchoolTransport")}
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPending ? "Creating…" : "Create student record"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  disabled,
  placeholder,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-text">
        {label}
        {required && <span className="text-critical-text"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`rounded-[11px] border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:bg-surface disabled:opacity-60 ${
          error ? "border-critical-text focus:border-critical-text" : "border-border focus:border-primary"
        }`}
      />
      {error && <span className="text-xs text-critical-text">{error}</span>}
    </label>
  );
}

function SelectField({
  label,
  name,
  required,
  disabled,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  options: [string, string][];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
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
        className={`rounded-[11px] border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:bg-surface disabled:opacity-60 ${
          error ? "border-critical-text focus:border-critical-text" : "border-border focus:border-primary"
        }`}
      >
        {options.map(([value, text]) => (
          <option key={value} value={value} disabled={required && value === ""}>
            {text}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-critical-text">{error}</span>}
    </label>
  );
}

function Checkbox({
  label,
  name,
  disabled,
  checked,
  onChange,
}: {
  label: string;
  name: string;
  disabled?: boolean;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-text">
      <input
        type="checkbox"
        name={name}
        disabled={disabled}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-border"
      />
      {label}
    </label>
  );
}
