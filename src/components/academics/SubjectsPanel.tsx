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

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="py-2.5 pr-3">Name</th>
              <th className="py-2.5 pr-3">Code</th>
              <th className="py-2.5 pr-3">Type</th>
              <th className="py-2.5 pr-3">Status</th>
              <th className="py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {subjects.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-text-muted">
                  No subjects yet.
                </td>
              </tr>
            )}
            {subjects.map((subject) => (
              <SubjectRow key={subject.id} subject={subject} editing={editingId === subject.id} onToggle={() => setEditingId((v) => (v === subject.id ? null : subject.id))} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubjectRow({ subject, editing, onToggle }: { subject: Subject; editing: boolean; onToggle: () => void }) {
  const action = updateSubjectAction.bind(null, subject.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <>
      <tr>
        <td className="py-3 pr-3 font-semibold text-text">{subject.name}</td>
        <td className="py-3 pr-3 font-mono text-text-muted">{subject.code}</td>
        <td className="py-3 pr-3 text-text-muted">{subject.subjectType.replace(/_/g, " ").toLowerCase()}</td>
        <td className="py-3 pr-3">
          <StatusPill tone={subject.status === "ACTIVE" ? "success" : "pending"} label={subject.status} />
        </td>
        <td className="py-3 text-right">
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </td>
      </tr>
      {editing && (
        <tr>
          <td colSpan={5} className="pb-3">
            <form action={formAction} className="flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
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
          </td>
        </tr>
      )}
    </>
  );
}
