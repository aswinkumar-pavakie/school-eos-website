"use client";

import { useActionState, useState } from "react";
import { createSubjectAction, updateSubjectAction, type FormActionState } from "@/app/(dashboard)/admin/academics/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, PanelCreateForm, SelectField } from "./shared";

export interface Subject {
  id: string;
  name: string;
  code: string;
  subjectType: string;
  appliesToStage: string | null;
  status: string;
}

const TYPES: [string, string][] = [
  ["CORE", "Core"],
  ["LANGUAGE", "Language"],
  ["OPTIONAL", "Optional"],
  ["VOCATIONAL", "Vocational"],
  ["CO_SCHOLASTIC", "Co-scholastic"],
];

const initialState: FormActionState = {};

export function SubjectsPanel({ subjects }: { subjects: Subject[] }) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createSubjectAction, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{subjects.length} subjects</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New subject
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm
          title="New subject"
          onCancel={() => setAdding(false)}
          formAction={formAction}
          isPending={isPending}
          error={state.error}
          submitLabel="Create"
        >
          <Field label="Name" name="name" required disabled={isPending} placeholder="Mathematics" />
          <Field label="Code" name="code" required disabled={isPending} placeholder="MATH" />
          <SelectField label="Type" name="subjectType" required disabled={isPending} options={[["", "Select"], ...TYPES]} />
        </PanelCreateForm>
      )}

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {subjects.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No subjects yet.</li>}
        {subjects.map((subject) => (
          <SubjectRow key={subject.id} subject={subject} editing={editingId === subject.id} onToggle={() => setEditingId((v) => (v === subject.id ? null : subject.id))} />
        ))}
      </ul>
    </div>
  );
}

function SubjectRow({ subject, editing, onToggle }: { subject: Subject; editing: boolean; onToggle: () => void }) {
  const action = updateSubjectAction.bind(null, subject.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text">
            {subject.name} <span className="font-mono text-text-muted">· {subject.code}</span>
          </p>
          <p className="text-xs text-text-muted">{subject.subjectType.replace(/_/g, " ").toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={subject.status === "ACTIVE" ? "success" : "pending"} label={subject.status} />
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>
      {editing && (
        <form action={formAction} className="mt-2.5 flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
          {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Name" name="name" disabled={isPending} defaultValue={subject.name} />
            <Field label="Code" name="code" disabled={isPending} defaultValue={subject.code} />
            <SelectField label="Type" name="subjectType" disabled={isPending} defaultValue={subject.subjectType} options={TYPES} />
            <SelectField
              label="Status"
              name="status"
              disabled={isPending}
              defaultValue={subject.status}
              options={[
                ["ACTIVE", "Active"],
                ["INACTIVE", "Inactive"],
              ]}
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-fit rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </li>
  );
}
