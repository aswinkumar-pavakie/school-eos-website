"use client";

// Create-faculty modal -- Design Architecture v0.1 component 13 (Modal, 480px web).
// Unlike Students, Faculty needs a real login: this form drives a two-step Server
// Action (POST /persons then POST /staff). On success the modal switches to its own
// Confirmation-dialog state (component 22) showing the one-time temporary password --
// it is NEVER put in a URL (redirect, query param, etc.), since that would leak it
// into browser history, server access logs, and the Referer header. It's shown here
// once and is not retrievable again after the modal closes.

import { useActionState, useState } from "react";
import Link from "next/link";
import { createFacultyAction, type FormActionState } from "@/app/(dashboard)/admin/faculty/actions";

const initialState: FormActionState = {};

export function CreateFacultyModal() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createFacultyAction, initialState);
  const created = Boolean(state.staffId);

  function handleClose() {
    setOpen(false);
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
          <div className="w-full max-w-[480px] rounded-[16px] bg-surface p-6 shadow-lg">
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
                    onClick={handleClose}
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
                <Field label="First name" name="firstName" required disabled={isPending} />
                <Field label="Last name" name="lastName" disabled={isPending} />
              </div>

              <SelectField
                label="Gender"
                name="gender"
                disabled={isPending}
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
                />
              </div>

              <Field label="Address line 1" name="addressLine1" required disabled={isPending} />
              <Field label="Address line 2 (optional)" name="addressLine2" disabled={isPending} />
              <div className="grid grid-cols-3 gap-4">
                <Field label="City" name="city" required disabled={isPending} />
                <Field label="State" name="state" required disabled={isPending} />
                <Field label="Pincode" name="pincode" required disabled={isPending} placeholder="6 digits" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Employee no." name="employeeNo" required disabled={isPending} />
                <Field label="Date of joining" name="dateOfJoining" type="date" required disabled={isPending} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Designation" name="designation" disabled={isPending} />
                <Field label="Teacher category" name="teacherCategory" disabled={isPending} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Post type"
                  name="postType"
                  disabled={isPending}
                  options={[
                    ["", "Select"],
                    ["GOVERNMENT", "Government"],
                    ["AIDED", "Aided"],
                    ["MANAGEMENT", "Management"],
                  ]}
                />
                <Field label="State teacher ID" name="stateTeacherId" disabled={isPending} />
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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
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
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  disabled,
  options,
}: {
  label: string;
  name: string;
  disabled?: boolean;
  options: [string, string][];
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-text">{label}</span>
      <select
        name={name}
        disabled={disabled}
        defaultValue={options[0][0]}
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
