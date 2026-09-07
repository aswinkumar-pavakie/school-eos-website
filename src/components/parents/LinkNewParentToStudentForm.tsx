"use client";

// Shown right after a new parent account is created -- lets the admin link them
// to one or more children right here, either by searching for an existing
// student or by quick-creating a new one on the spot, instead of remembering the
// parent's person ID and doing this later from each student's own profile.
// Repeatable: every successful link/create adds to a running list below, and the
// picker resets so another child can be added immediately.

import { useActionState, useEffect, useRef, useState } from "react";
import { createGuardianAction, type FormActionState } from "@/app/(dashboard)/admin/students/actions";
import { quickCreateStudentAndLinkAction, type QuickCreateStudentState } from "@/app/(dashboard)/admin/parents/actions";
import { StudentPersonPicker } from "./StudentPersonPicker";

const guardianInitialState: FormActionState = {};
const createInitialState: QuickCreateStudentState = {};

interface StudentHit {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
}

const RELATIONSHIP_OPTIONS: [string, string][] = [
  ["FATHER", "Father"],
  ["MOTHER", "Mother"],
  ["GUARDIAN", "Guardian"],
  ["GRANDPARENT", "Grandparent"],
  ["SIBLING", "Sibling"],
  ["OTHER", "Other"],
];

export function LinkNewParentToStudentForm({
  parentPersonId,
  presetStudent,
}: {
  parentPersonId: string;
  presetStudent?: { id: string; label: string };
}) {
  const [linkedChildren, setLinkedChildren] = useState<{ id: string; name: string }[]>([]);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="mt-3 text-sm font-semibold text-success-text">
        {linkedChildren.length > 0 ? `Linked to ${linkedChildren.length} student(s).` : "Done."}
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
      <p className="text-[13px] font-bold text-text">Link to student(s) now (optional)</p>

      {linkedChildren.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-text">
          {linkedChildren.map((c) => (
            <li key={c.id} className="flex items-center gap-1.5">
              <span className="text-success-text">✓</span> {c.name}
            </li>
          ))}
        </ul>
      )}

      {!presetStudent && (
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} />
            Existing student
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={mode === "new"} onChange={() => setMode("new")} />
            Create new student
          </label>
        </div>
      )}

      {presetStudent || mode === "existing" ? (
        <ExistingStudentForm
          parentPersonId={parentPersonId}
          presetStudent={presetStudent}
          onLinked={(child) => setLinkedChildren((prev) => [...prev, child])}
        />
      ) : (
        <NewStudentForm
          parentPersonId={parentPersonId}
          onLinked={(child) => setLinkedChildren((prev) => [...prev, child])}
        />
      )}

      <button type="button" onClick={() => setDone(true)} className="self-start text-[13px] font-semibold text-text-muted">
        {linkedChildren.length > 0 ? "Done linking" : "Skip for now"}
      </button>
    </div>
  );
}

function ExistingStudentForm({
  parentPersonId,
  presetStudent,
  onLinked,
}: {
  parentPersonId: string;
  presetStudent?: { id: string; label: string };
  onLinked: (child: { id: string; name: string }) => void;
}) {
  const [student, setStudent] = useState<StudentHit | null>(null);
  const studentId = presetStudent?.id ?? student?.id ?? "";
  const action = createGuardianAction.bind(null, studentId);
  const [state, formAction, isPending] = useActionState(action, guardianInitialState);
  const [formKey, setFormKey] = useState(0);
  const pendingLink = useRef<{ id: string; name: string } | null>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error && pendingLink.current) {
      onLinked(pendingLink.current);
      pendingLink.current = null;
      setStudent(null);
      setFormKey((k) => k + 1);
    }
    wasPending.current = isPending;
    // onLinked isn't a stable dependency across renders -- only isPending/state.error matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, state.error]);

  return (
    <form
      key={formKey}
      action={(formData) => {
        const relationship = formData.get("relationship") as string;
        const name = presetStudent?.label ?? `${student?.firstName} ${student?.lastName ?? ""}`.trim();
        pendingLink.current = { id: studentId, name: `${name} (${relationship.toLowerCase()})` };
        formAction(formData);
      }}
      className="flex flex-col gap-3"
    >
      {state.error && (
        <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
      )}
      <input type="hidden" name="personId" value={parentPersonId} />

      {presetStudent ? (
        <p className="text-sm text-text">{presetStudent.label}</p>
      ) : (
        <StudentPersonPicker disabled={isPending} onSelect={setStudent} />
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Relationship *</span>
          <select
            name="relationship"
            required
            disabled={isPending}
            defaultValue=""
            className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
          >
            <option value="" disabled>
              Select
            </option>
            {RELATIONSHIP_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5 text-[13px] text-text">
          <input type="checkbox" name="isPrimaryContact" disabled={isPending} className="h-4 w-4 rounded border-border" />
          Primary contact
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending || !studentId}
        className="self-start rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Linking…" : "Link this student"}
      </button>
    </form>
  );
}

function NewStudentForm({
  parentPersonId,
  onLinked,
}: {
  parentPersonId: string;
  onLinked: (child: { id: string; name: string }) => void;
}) {
  const action = quickCreateStudentAndLinkAction.bind(null, parentPersonId);
  const [state, formAction, isPending] = useActionState(action, createInitialState);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state.studentId && state.studentName && !state.error) {
      onLinked({ id: state.studentId, name: state.studentName });
      setFormKey((k) => k + 1);
    }
    // Only re-run when a fresh success actually arrives (a new studentId) --
    // onLinked itself isn't a stable dependency across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.studentId]);

  return (
    <form
      key={formKey}
      action={formAction}
      className="flex flex-col gap-3"
    >
      {state.error && (
        <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
      )}
      <p className="text-xs text-text-muted">
        Just the essentials — fill in the rest from the student&apos;s own profile afterward.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">First name *</span>
          <input
            name="firstName"
            required
            disabled={isPending}
            className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Last name</span>
          <input
            name="lastName"
            disabled={isPending}
            className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Admission no. *</span>
          <input
            name="admissionNo"
            required
            disabled={isPending}
            className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Admission date *</span>
          <input
            type="date"
            name="admissionDate"
            required
            disabled={isPending}
            className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Mobile</span>
          <input
            name="mobile"
            disabled={isPending}
            className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Email</span>
          <input
            type="email"
            name="email"
            disabled={isPending}
            className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
          />
        </label>
      </div>
      <p className="-mt-2 text-xs text-text-muted">At least one of mobile or email is required.</p>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Relationship *</span>
        <select
          name="relationship"
          required
          disabled={isPending}
          defaultValue=""
          className="max-w-[200px] rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
        >
          <option value="" disabled>
            Select
          </option>
          {RELATIONSHIP_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Create student & link"}
      </button>
    </form>
  );
}
