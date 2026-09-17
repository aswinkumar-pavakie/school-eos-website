"use client";

import { useActionState, useState } from "react";
import { createSubjectAction, updateSubjectAction, type FormActionState } from "@/app/(dashboard)/admin/academics/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, PanelCreateFormRow, PanelHeader, SelectField } from "./shared";

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
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = typeFilter ? subjects.filter((s) => s.subjectType === typeFilter) : subjects;

  return (
    <div>
      <PanelHeader
        title="Subjects"
        subtitle={`${subjects.length} subject${subjects.length === 1 ? "" : "s"}`}
        actionLabel="+ New subject"
        onAction={() => setAdding(true)}
        hideAction={adding}
      />

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">Filter by type</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="min-w-[180px] rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            <option value="">All types</option>
            {TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

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
            {adding && (
              <PanelCreateFormRow
                colSpan={5}
                onCancel={() => setAdding(false)}
                formAction={formAction}
                isPending={isPending}
                error={state.error}
              >
                <Field label="Subject name" name="name" required disabled={isPending} placeholder="Mathematics" />
                <Field label="Code" name="code" required disabled={isPending} placeholder="MATH" />
                <SelectField label="Type" name="subjectType" required disabled={isPending} options={[["", "Select"], ...TYPES]} />
                <SelectField
                  label="Status"
                  name="status"
                  disabled={isPending}
                  defaultValue="ACTIVE"
                  options={[
                    ["ACTIVE", "Active"],
                    ["INACTIVE", "Inactive"],
                  ]}
                />
              </PanelCreateFormRow>
            )}
            {filtered.length === 0 && !adding && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-text-muted">
                  {subjects.length === 0 ? "No subjects yet." : "No subjects match this filter."}
                </td>
              </tr>
            )}
            {filtered.map((subject) => (
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
