"use client";

// Create-faculty modal -- Design Architecture v0.1 component 13 (Modal, was 480px
// web, widened to 760px -- was cramped, especially the 3-column City/State/Pincode
// row -- same width CreateStudentModal already moved to for the same reason).
// Unlike Students, Faculty needs a real login: this form drives a two-step Server
// Action (POST /persons then POST /staff). On success the modal switches to its own
// Confirmation-dialog state (component 22) showing the one-time temporary password --
// it is NEVER put in a URL (redirect, query param, etc.), since that would leak it
// into browser history, server access logs, and the Referer header. It's shown here
// once and is not retrievable again after the modal closes.
//
// Fields are controlled (value/onChange into a local `values` object) rather than
// plain uncontrolled inputs -- a Server Action's own <form action=...> submission
// resets uncontrolled fields once the action completes, even on failure, which was
// wiping every field the admin had already typed just because one field failed
// validation. Controlled inputs aren't touched by that reset, so a failed
// submission only shows an inline error under the specific bad field (fieldErrors,
// from the backend's own per-property validation messages -- see
// lib/form-errors.ts) while everything else stays exactly as typed.
//
// Designation is genuinely free text on the backend (staff.designation is a plain
// column, not an FK to a lookup table -- see staff.service.ts's own
// listDesignations(), which runs a DISTINCT query over existing values rather than
// reading a fixed table). A strict <select> would wrongly block ever hiring into a
// brand-new designation, so this uses a <datalist>-backed input instead: it
// suggests every designation already in real use (fetched via the same
// GET /staff/designations this page's own filter bar already calls), but still
// accepts free text for a genuinely new one.
//
// Extra responsibility role (optional): a new hire can be given Academic
// Coordinator / Sports Faculty / Class Advisor right here instead of a
// separate trip to Academics -> Assign role afterward -- same real
// role_assignment system every other role uses (see this repo's
// admin/academics/actions.ts for assignCoordinatorAction/
// assignClassAdvisorAction, the pre-existing flows this reuses via the
// server action, not a second implementation). If the chosen scope already
// has a different active holder, that holder is revoked first -- same
// one-active-holder-per-scope guarantee assignCoordinatorAction now enforces
// there, so "1 email, multiple role allocations" stays correct: the new
// hire's own login gains the role's features, the previous holder's login
// loses them, cleanly, with no stale double-holder.

import { useActionState, useState } from "react";
import Link from "next/link";
import { createFacultyAction, type FormActionState } from "@/app/(dashboard)/admin/faculty/actions";

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

const STAGES: [string, string][] = [
  ["PRE_PRIMARY", "Pre-primary"],
  ["PRIMARY", "Primary"],
  ["MIDDLE", "Middle"],
  ["SECONDARY", "Secondary"],
  ["HIGHER_SECONDARY", "Higher secondary"],
];

const emptyValues = {
  firstName: "",
  lastName: "",
  gender: "",
  identifierType: "EMAIL",
  identifierValue: "",
  initialPassword: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  employeeNo: "",
  dateOfJoining: "",
  designation: "",
  teacherCategory: "",
  postType: "",
  stateTeacherId: "",
  experienceYears: "",
  extraRoleScopeStage: "",
  extraRoleScopeGradeId: "",
  extraRoleSectionId: "",
};

export function CreateFacultyModal({
  designations,
  grades,
  sections,
}: {
  designations: string[];
  grades: Grade[];
  sections: Section[];
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(emptyValues);
  const [state, formAction, isPending] = useActionState(createFacultyAction, initialState);
  const created = Boolean(state.staffId);
  const fieldErrors = state.fieldErrors ?? {};
  const [extraRole, setExtraRole] = useState<"" | "ACADEMIC_COORDINATOR" | "SPORTS_FACULTY" | "CLASS_ADVISOR">("");
  const [coordScopeKind, setCoordScopeKind] = useState<"STAGE" | "GRADE">("STAGE");
  const gradeById = new Map(grades.map((g) => [g.id, g.name]));

  function handleChange(name: keyof typeof emptyValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
    };
  }

  function handleClose() {
    setOpen(false);
    setValues(emptyValues);
    setExtraRole("");
    setCoordScopeKind("STAGE");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,111,224,.25)] transition-opacity hover:opacity-90"
      >
        + New faculty
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#101828]/45 px-4 py-10">
          <div className="w-full max-w-[760px] rounded-[16px] bg-surface p-6 shadow-lg">
            {created ? (
              <>
                <h2 className="text-[15px] font-extrabold leading-[20px] text-text">
                  Faculty account created
                </h2>
                <p className="mt-1.5 text-sm text-text-muted">
                  This is the only time the temporary password is shown. Share it with
                  the faculty member now — they should sign in and change it as soon as
                  possible.
                </p>
                <p className="mt-4 rounded-[11px] bg-field px-3.5 py-2.5 font-mono text-[15px] font-semibold text-text">
                  {state.temporaryPassword}
                </p>
                <div className="mt-5 flex gap-3">
                  <Link
                    href={`/admin/faculty/${state.staffId}`}
                    onClick={handleClose}
                    className="flex-1 rounded-[11px] bg-primary px-4 py-2.5 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
                  >
                    View profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-[11px] border border-border px-4 py-2.5 text-sm font-bold text-text hover:bg-bg"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-extrabold leading-[20px] text-text">New faculty account</h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg"
                  >
                    ×
                  </button>
                </div>
                <p className="mt-1.5 text-[13px] text-text-muted">
                  Faculty is a real mobile login — this creates the account and a
                  one-time temporary password, then attaches employment details.
                </p>

                {state.error && (
                  <p
                    role="alert"
                    className="mt-4 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm font-medium text-critical-text"
                  >
                    {state.error}
                  </p>
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

                  <div className="grid grid-cols-[auto_1fr] gap-4">
                    <SelectField
                      label="Login via"
                      name="identifierType"
                      disabled={isPending}
                      value={values.identifierType}
                      onChange={handleChange("identifierType")}
                      error={fieldErrors.identifierType}
                      options={[
                        ["EMAIL", "Email"],
                        ["MOBILE", "Mobile"],
                      ]}
                    />
                    <Field
                      label="Email or mobile"
                      name="identifierValue"
                      required
                      disabled={isPending}
                      placeholder="name@school.in or 10-digit mobile"
                      value={values.identifierValue}
                      onChange={handleChange("identifierValue")}
                      error={fieldErrors.identifierValue}
                    />
                  </div>

                  <Field
                    label="Set password (optional)"
                    name="initialPassword"
                    disabled={isPending}
                    placeholder="Leave blank to auto-generate one"
                    minLength={8}
                    value={values.initialPassword}
                    onChange={handleChange("initialPassword")}
                    error={fieldErrors.initialPassword}
                  />
                  <p className="-mt-2 text-[13px] text-text-muted">
                    Leave blank and one is generated for you — either way, the
                    password is shown once on the next screen so you can pass it on
                    to the faculty member yourself.
                  </p>

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
                      label="Employee no."
                      name="employeeNo"
                      required
                      disabled={isPending}
                      value={values.employeeNo}
                      onChange={handleChange("employeeNo")}
                      error={fieldErrors.employeeNo}
                    />
                    <Field
                      label="Date of joining"
                      name="dateOfJoining"
                      type="date"
                      required
                      disabled={isPending}
                      value={values.dateOfJoining}
                      onChange={handleChange("dateOfJoining")}
                      error={fieldErrors.dateOfJoining}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Designation"
                      name="designation"
                      disabled={isPending}
                      placeholder="e.g. Tamil Teacher"
                      listOptions={designations}
                      value={values.designation}
                      onChange={handleChange("designation")}
                      error={fieldErrors.designation}
                    />
                    <Field
                      label="Teacher category"
                      name="teacherCategory"
                      disabled={isPending}
                      value={values.teacherCategory}
                      onChange={handleChange("teacherCategory")}
                      error={fieldErrors.teacherCategory}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <SelectField
                      label="Post type"
                      name="postType"
                      disabled={isPending}
                      value={values.postType}
                      onChange={handleChange("postType")}
                      error={fieldErrors.postType}
                      options={[
                        ["", "Select"],
                        ["GOVERNMENT", "Government"],
                        ["AIDED", "Aided"],
                        ["MANAGEMENT", "Management"],
                      ]}
                    />
                    <Field
                      label="State teacher ID"
                      name="stateTeacherId"
                      disabled={isPending}
                      value={values.stateTeacherId}
                      onChange={handleChange("stateTeacherId")}
                      error={fieldErrors.stateTeacherId}
                    />
                    <Field
                      label="Experience (years, optional)"
                      name="experienceYears"
                      type="number"
                      disabled={isPending}
                      placeholder="After reviewing certificates"
                      value={values.experienceYears}
                      onChange={handleChange("experienceYears")}
                      error={fieldErrors.experienceYears}
                    />
                  </div>

                  <label className="flex items-center gap-2 text-[13px] text-text">
                    <input
                      type="checkbox"
                      name="isTeaching"
                      defaultChecked
                      disabled={isPending}
                      className="h-4 w-4 rounded border-border"
                    />
                    Teaching staff
                  </label>

                  <div className="flex flex-col gap-3 border-t border-border pt-4">
                    <div>
                      <h3 className="text-[13px] font-bold text-text">Extra responsibility role (optional)</h3>
                      <p className="text-xs text-text-muted">
                        If this scope already has someone else assigned, they&apos;ll be moved off it automatically.
                      </p>
                    </div>
                    <select
                      name="extraRole"
                      value={extraRole}
                      onChange={(e) => setExtraRole(e.target.value as typeof extraRole)}
                      disabled={isPending}
                      className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
                    >
                      <option value="">None</option>
                      <option value="ACADEMIC_COORDINATOR">Academic Coordinator</option>
                      <option value="SPORTS_FACULTY">Sports Faculty</option>
                      <option value="CLASS_ADVISOR">Class Advisor</option>
                    </select>

                    {(extraRole === "ACADEMIC_COORDINATOR" || extraRole === "SPORTS_FACULTY") && (
                      <>
                        <div className="flex gap-4 text-sm">
                          <label className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              name="extraRoleScopeKind"
                              checked={coordScopeKind === "STAGE"}
                              onChange={() => setCoordScopeKind("STAGE")}
                              disabled={isPending}
                            />
                            By stage
                          </label>
                          <label className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              name="extraRoleScopeKind"
                              checked={coordScopeKind === "GRADE"}
                              onChange={() => setCoordScopeKind("GRADE")}
                              disabled={isPending}
                            />
                            By standard
                          </label>
                        </div>
                        {coordScopeKind === "STAGE" ? (
                          <SelectField
                            label="Stage covered"
                            name="extraRoleScopeStage"
                            disabled={isPending}
                            value={values.extraRoleScopeStage}
                            onChange={handleChange("extraRoleScopeStage")}
                            error={fieldErrors.extraRoleScopeStage}
                            options={[["", "Select"], ...STAGES]}
                          />
                        ) : (
                          <SelectField
                            label="Standard covered"
                            name="extraRoleScopeGradeId"
                            disabled={isPending}
                            value={values.extraRoleScopeGradeId}
                            onChange={handleChange("extraRoleScopeGradeId")}
                            error={fieldErrors.extraRoleScopeGradeId}
                            options={[["", "Select"], ...grades.map((g) => [g.id, g.name] as [string, string])]}
                          />
                        )}
                      </>
                    )}

                    {extraRole === "CLASS_ADVISOR" && (
                      <SelectField
                        label="Section"
                        name="extraRoleSectionId"
                        disabled={isPending}
                        value={values.extraRoleSectionId}
                        onChange={handleChange("extraRoleSectionId")}
                        error={fieldErrors.extraRoleSectionId}
                        options={[
                          ["", "Select"],
                          ...sections.map((s) => [s.id, `${gradeById.get(s.gradeId) ?? "—"} · ${s.name}`] as [string, string]),
                        ]}
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="mt-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isPending ? "Creating…" : "Create faculty account"}
                  </button>
                </form>
              </>
            )}
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
  listOptions,
  minLength,
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
  /** Real, already-in-use values suggested via a native <datalist> -- the field
   * stays free text (see this file's own header comment on why designation
   * can't be a strict <select>), this just makes existing values easy to
   * reuse instead of retyping. */
  listOptions?: string[];
  minLength?: number;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  const listId = listOptions ? `${name}-options` : undefined;
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
        list={listId}
        minLength={minLength}
        value={value}
        onChange={onChange}
        className={`rounded-[11px] border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:bg-surface disabled:opacity-60 ${
          error ? "border-critical-text focus:border-critical-text" : "border-border focus:border-primary"
        }`}
      />
      {listOptions && (
        <datalist id={listId}>
          {listOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      )}
      {error && <span className="text-xs text-critical-text">{error}</span>}
    </label>
  );
}

function SelectField({
  label,
  name,
  disabled,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  disabled?: boolean;
  options: [string, string][];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-text">{label}</span>
      <select
        name={name}
        disabled={disabled}
        value={value}
        onChange={onChange}
        className={`rounded-[11px] border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:bg-surface disabled:opacity-60 ${
          error ? "border-critical-text focus:border-critical-text" : "border-border focus:border-primary"
        }`}
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-critical-text">{error}</span>}
    </label>
  );
}
