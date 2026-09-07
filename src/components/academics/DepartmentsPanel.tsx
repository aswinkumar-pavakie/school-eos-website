"use client";

import { useActionState, useState } from "react";
import { createDepartmentAction, updateDepartmentAction, type FormActionState } from "@/app/(dashboard)/admin/academics/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, PanelCreateForm, SelectField } from "./shared";

export interface Department {
  id: string;
  name: string;
  code: string | null;
  status: string;
}

const initialState: FormActionState = {};

export function DepartmentsPanel({ departments }: { departments: Department[] }) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createDepartmentAction, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{departments.length} departments</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New department
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm
          title="New department"
          onCancel={() => setAdding(false)}
          formAction={formAction}
          isPending={isPending}
          error={state.error}
          submitLabel="Create"
        >
          <Field label="Name" name="name" required disabled={isPending} placeholder="Science" />
          <Field label="Code" name="code" disabled={isPending} placeholder="SCI" />
        </PanelCreateForm>
      )}

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {departments.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No departments yet.</li>}
        {departments.map((dept) => (
          <DeptRow key={dept.id} dept={dept} editing={editingId === dept.id} onToggle={() => setEditingId((v) => (v === dept.id ? null : dept.id))} />
        ))}
      </ul>
    </div>
  );
}

function DeptRow({ dept, editing, onToggle }: { dept: Department; editing: boolean; onToggle: () => void }) {
  const action = updateDepartmentAction.bind(null, dept.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text">
            {dept.name} {dept.code && <span className="font-mono text-text-muted">· {dept.code}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={dept.status === "ACTIVE" ? "success" : "pending"} label={dept.status} />
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>
      {editing && (
        <form action={formAction} className="mt-2.5 flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
          {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Name" name="name" disabled={isPending} defaultValue={dept.name} />
            <Field label="Code" name="code" disabled={isPending} defaultValue={dept.code ?? undefined} />
            <SelectField
              label="Status"
              name="status"
              disabled={isPending}
              defaultValue={dept.status}
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
