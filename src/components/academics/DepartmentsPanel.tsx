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

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="py-2.5 pr-3">Name</th>
              <th className="py-2.5 pr-3">Code</th>
              <th className="py-2.5 pr-3">Status</th>
              <th className="py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-text-muted">
                  No departments yet.
                </td>
              </tr>
            )}
            {departments.map((dept) => (
              <DeptRow key={dept.id} dept={dept} editing={editingId === dept.id} onToggle={() => setEditingId((v) => (v === dept.id ? null : dept.id))} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeptRow({ dept, editing, onToggle }: { dept: Department; editing: boolean; onToggle: () => void }) {
  const action = updateDepartmentAction.bind(null, dept.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <>
      <tr>
        <td className="py-3 pr-3 font-semibold text-text">{dept.name}</td>
        <td className="py-3 pr-3 font-mono text-text-muted">{dept.code ?? "—"}</td>
        <td className="py-3 pr-3">
          <StatusPill tone={dept.status === "ACTIVE" ? "success" : "pending"} label={dept.status} />
        </td>
        <td className="py-3 text-right">
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </td>
      </tr>
      {editing && (
        <tr>
          <td colSpan={4} className="pb-3">
            <form action={formAction} className="flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
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
          </td>
        </tr>
      )}
    </>
  );
}
