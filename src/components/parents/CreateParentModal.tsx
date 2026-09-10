"use client";

// Create-parent modal -- Design Architecture v0.1 component 13 (Modal, web).
// Widened to 760px with a multi-column grid, same treatment CreateStudentModal
// and CreateFacultyModal already got. Parent needs a real login (like Faculty)
// but no subtype step (unlike Faculty) -- one call to POST /persons. On success
// the modal shows its own Confirmation-dialog state (component 22) with the
// one-time temporary password, then links to the new parent's profile. The
// generated password is never put in a URL -- same corrected pattern as
// CreateFacultyModal.tsx.
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
//
// Rendered via createPortal into document.body rather than inline: this modal's
// "Not found -- create new parent" trigger is used from inside GuardiansSection's
// own <form> (the "link guardian" form on a student's profile), and this modal's
// overlay contains its own <form>. Rendered inline, that put a <form> inside a
// <form> in the actual DOM despite the overlay being visually a full-screen
// fixed-position layer -- invalid HTML that Next.js/React flagged as a hydration
// error. The portal keeps the overlay's real DOM position at the body root, same
// as any other real-world modal, while staying part of this component's React
// tree for state/context.

import { useActionState, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { createParentAction, type FormActionState } from "@/app/(dashboard)/admin/parents/actions";
import { LinkNewParentToStudentForm } from "./LinkNewParentToStudentForm";

const initialState: FormActionState = {};

const emptyValues = {
  firstName: "",
  lastName: "",
  gender: "",
  identifierType: "EMAIL",
  identifierValue: "",
  initialPassword: "",
};

export function CreateParentModal({
  presetStudent,
  triggerLabel = "+ New parent",
}: {
  /** When opened from a student's own profile (GuardiansSection), skip the student
   * search after creating the parent and link straight to this one. */
  presetStudent?: { id: string; label: string };
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(emptyValues);
  const [state, formAction, isPending] = useActionState(createParentAction, initialState);
  const created = Boolean(state.personId);
  const fieldErrors = state.fieldErrors ?? {};

  function handleChange(name: keyof typeof emptyValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
    };
  }

  function handleClose() {
    setOpen(false);
    setValues(emptyValues);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          presetStudent
            ? "text-[13px] font-semibold text-primary"
            : "flex items-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,111,224,.25)] transition-opacity hover:opacity-90"
        }
      >
        {triggerLabel}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#101828]/45 px-4 py-10">
            <div className="w-full max-w-[760px] rounded-[16px] bg-surface p-6 shadow-lg">
              {created ? (
                <>
                  <h2 className="text-[15px] font-extrabold leading-[20px] text-text">
                    Parent account created
                  </h2>
                  <p className="mt-1.5 text-sm text-text-muted">
                    This is the only time the temporary password is shown. Share it with
                    the parent now — they should sign in and change it as soon as
                    possible.
                  </p>
                  <p className="mt-4 rounded-[11px] bg-field px-3.5 py-2.5 font-mono text-[15px] font-semibold text-text">
                    {state.temporaryPassword}
                  </p>

                  <LinkNewParentToStudentForm parentPersonId={state.personId!} presetStudent={presetStudent} />

                  <div className="mt-5 flex gap-3">
                    <Link
                      href={`/admin/parents/${state.personId}`}
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
                    <h2 className="text-[15px] font-extrabold leading-[20px] text-text">New parent account</h2>
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
                    Parent is a real mobile login — this creates the account and a
                    one-time temporary password. Link them to a child afterwards from
                    the student&apos;s own profile.
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
                    <div className="grid grid-cols-3 gap-4">
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
                        placeholder="name@example.com or 10-digit mobile"
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
                      password is shown once on the next screen so you can pass it
                      on to the parent yourself.
                    </p>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="mt-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isPending ? "Creating…" : "Create parent account"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function Field({
  label,
  name,
  required,
  disabled,
  placeholder,
  minLength,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  minLength?: number;
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
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        minLength={minLength}
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
