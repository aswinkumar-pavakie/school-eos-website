"use client";

// Create-student modal -- Design Architecture v0.1 component 13 (Modal, 480px web,
// same field rhythm as the mobile bottom sheet). Two-column field layout per
// reference-img/admission-student.png, our own field set and tokens.

import { useActionState, useState } from "react";
import Link from "next/link";
import { createStudentAction, type FormActionState } from "@/app/(dashboard)/admin/students/actions";

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

export function CreateStudentModal({ grades, sections }: { grades: Grade[]; sections: Section[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createStudentAction, initialState);
  const gradeById = new Map(grades.map((g) => [g.id, g.name]));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,111,224,.25)] transition-opacity hover:opacity-90"
      >
        + New admission
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#101828]/45 px-4 py-10">
          <div className="w-full max-w-[480px] rounded-[16px] bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">New admission</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
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
                <Field label="First name" name="firstName" required disabled={isPending} />
                <Field label="Last name" name="lastName" disabled={isPending} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Date of birth" name="dateOfBirth" type="date" disabled={isPending} />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Mobile" name="mobile" placeholder="10 digits" disabled={isPending} />
                <Field label="Email" name="email" type="email" disabled={isPending} />
              </div>
              <p className="-mt-2 text-xs text-text-muted">At least one of mobile or email is required.</p>

              <Field label="Address line 1" name="addressLine1" required disabled={isPending} />
              <Field label="Address line 2 (optional)" name="addressLine2" disabled={isPending} />
              <div className="grid grid-cols-3 gap-4">
                <Field label="City" name="city" required disabled={isPending} />
                <Field label="State" name="state" required disabled={isPending} />
                <Field label="Pincode" name="pincode" required disabled={isPending} placeholder="6 digits" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Admission no." name="admissionNo" required disabled={isPending} />
                <Field label="Admission date" name="admissionDate" type="date" required disabled={isPending} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SelectField
                  label="Class (optional)"
                  name="sectionId"
                  disabled={isPending}
                  options={[
                    ["", "Assign later"],
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
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="State student ID"
                  name="stateStudentId"
                  disabled={isPending}
                  placeholder="e.g. TN2025034567"
                />
                <Field label="Blood group" name="bloodGroup" placeholder="e.g. O+" disabled={isPending} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Mother tongue" name="motherTongue" disabled={isPending} />
                <SelectField
                  label="Community category"
                  name="communityCategory"
                  disabled={isPending}
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
                <Checkbox label="First-generation learner" name="isFirstGenLearner" disabled={isPending} />
                <Checkbox label="Differently abled" name="isDifferentlyAbled" disabled={isPending} />
                <Checkbox label="Hosteller" name="isHosteller" disabled={isPending} />
                <Checkbox label="Uses school transport" name="usesSchoolTransport" disabled={isPending} />
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
        defaultValue=""
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

function Checkbox({ label, name, disabled }: { label: string; name: string; disabled?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-text">
      <input type="checkbox" name={name} disabled={disabled} className="h-4 w-4 rounded border-border" />
      {label}
    </label>
  );
}
