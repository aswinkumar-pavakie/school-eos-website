"use client";

import { useActionState, useState } from "react";
import { createGradeAction, updateGradeAction, type FormActionState } from "@/app/(dashboard)/admin/academics/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, PanelCreateForm, SelectField } from "./shared";

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
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{grades.length} grades</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New grade
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm
          title="New grade"
          onCancel={() => setAdding(false)}
          formAction={formAction}
          isPending={isPending}
          error={state.error}
          submitLabel="Create"
        >
          <Field label="Name" name="name" required disabled={isPending} placeholder="Grade 5" />
          <Field label="Level no. (-2 to 12)" name="levelNo" type="number" required disabled={isPending} />
          <SelectField label="Stage" name="stage" required disabled={isPending} options={[["", "Select"], ...STAGES]} />
        </PanelCreateForm>
      )}

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {grades.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No grades yet.</li>}
        {grades.map((grade) => (
          <GradeRow key={grade.id} grade={grade} editing={editingId === grade.id} onToggle={() => setEditingId((v) => (v === grade.id ? null : grade.id))} />
        ))}
      </ul>
    </div>
  );
}

function GradeRow({ grade, editing, onToggle }: { grade: Grade; editing: boolean; onToggle: () => void }) {
  const action = updateGradeAction.bind(null, grade.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text">
            {grade.name} <span className="text-text-muted">· level {grade.levelNo}</span>
          </p>
          <p className="text-xs text-text-muted">{grade.stage.replace(/_/g, " ").toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={grade.status === "ACTIVE" ? "success" : "pending"} label={grade.status} />
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>
      {editing && (
        <form action={formAction} className="mt-2.5 flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
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
      )}
    </li>
  );
}
