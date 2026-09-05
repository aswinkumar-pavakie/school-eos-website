"use client";

// Create-parent modal -- Design Architecture v0.1 component 13 (Modal, 480px web).
// Parent needs a real login (like Faculty) but no subtype step (unlike Faculty) --
// one call to POST /persons. On success the modal shows its own Confirmation-dialog
// state (component 22) with the one-time temporary password, then links to the new
// parent's profile. The generated password is never put in a URL -- same corrected
// pattern as CreateFacultyModal.tsx.

import { useActionState, useState } from "react";
import Link from "next/link";
import { createParentAction, type FormActionState } from "@/app/(dashboard)/admin/parents/actions";
import { LinkNewParentToStudentForm } from "./LinkNewParentToStudentForm";

const initialState: FormActionState = {};

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
  const [state, formAction, isPending] = useActionState(createParentAction, initialState);
  const created = Boolean(state.personId);

  function handleClose() {
    setOpen(false);
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#101828]/45 px-4 py-10">
          <div className="w-full max-w-[480px] rounded-[16px] bg-surface p-6 shadow-lg">
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
                    onClick={handleClose}
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
                      placeholder="name@example.com or 10-digit mobile"
                    />
                  </div>

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
        </div>
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
}: {
  label: string;
  name: string;
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
