"use client";

import { useActionState, useState } from "react";
import { createGradeAction, updateGradeAction, type FormActionState } from "@/app/(dashboard)/admin/academics/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, PanelCreateFormRow, PanelHeader, SelectField } from "./shared";

export interface Grade {
  id: string;
  name: string;
  levelNo: number;
  stage: string;
  status: string;
}

const STAGES: [string, string][] = [
  ["PRE_PRIMARY", "Pre-primary"],
  ["PRIMARY", "Primary"],
  ["MIDDLE", "Middle"],
  ["SECONDARY", "Secondary"],
  ["HIGHER_SECONDARY", "Higher secondary"],
];

const initialState: FormActionState = {};

export function GradesPanel({ grades }: { grades: Grade[] }) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createGradeAction, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <PanelHeader
        title="Grades"
        subtitle={`${grades.length} grade${grades.length === 1 ? "" : "s"}`}
        actionLabel="+ New grade"
        onAction={() => setAdding(true)}
        hideAction={adding}
      />

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="py-2.5 pr-3">Name</th>
              <th className="py-2.5 pr-3">Level no.</th>
              <th className="py-2.5 pr-3">Stage</th>
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
                <Field label="Grade name" name="name" required disabled={isPending} placeholder="Grade 5" />
                <Field label="Level no. (-2 to 12)" name="levelNo" type="number" required disabled={isPending} />
                <SelectField label="Stage" name="stage" required disabled={isPending} options={[["", "Select"], ...STAGES]} />
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
            {grades.length === 0 && !adding && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-text-muted">
                  No grades yet.
                </td>
              </tr>
            )}
            {grades.map((grade) => (
              <GradeRow key={grade.id} grade={grade} editing={editingId === grade.id} onToggle={() => setEditingId((v) => (v === grade.id ? null : grade.id))} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GradeRow({ grade, editing, onToggle }: { grade: Grade; editing: boolean; onToggle: () => void }) {
  const action = updateGradeAction.bind(null, grade.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <>
      <tr>
        <td className="py-3 pr-3 font-semibold text-text">{grade.name}</td>
        <td className="py-3 pr-3 text-text-muted">{grade.levelNo}</td>
        <td className="py-3 pr-3 text-text-muted">{grade.stage.replace(/_/g, " ").toLowerCase()}</td>
        <td className="py-3 pr-3">
          <StatusPill tone={grade.status === "ACTIVE" ? "success" : "pending"} label={grade.status} />
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
                <Field label="Name" name="name" disabled={isPending} defaultValue={grade.name} />
                <Field label="Level no." name="levelNo" type="number" disabled={isPending} defaultValue={grade.levelNo} />
                <SelectField label="Stage" name="stage" disabled={isPending} defaultValue={grade.stage} options={STAGES} />
                <SelectField
                  label="Status"
                  name="status"
                  disabled={isPending}
                  defaultValue={grade.status}
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
