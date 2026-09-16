"use client";

import { useActionState, useState } from "react";
import { StatusPill } from "@/components/dashboard/StatusPill";
import {
  createDepartmentAction,
  updateDepartmentAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/organization/actions";
import { Field } from "./shared";

export interface Department {
  id: string;
  name: string;
  code: string | null;
  hodStaffId: string | null;
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
        <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
          {state.error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" name="name" required disabled={isPending} />
            <Field label="Code" name="code" disabled={isPending} />
            <Field label="HOD staff ID (optional)" name="hodStaffId" disabled={isPending} placeholder="staff person UUID" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAdding(false)} className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
              {isPending ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      )}

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {departments.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No departments yet.</li>}
        {departments.map((d) => (
          <DepartmentRow key={d.id} department={d} editing={editingId === d.id} onToggle={() => setEditingId((v) => (v === d.id ? null : d.id))} />
        ))}
      </ul>
    </div>
  );
}

function DepartmentRow({ department, editing, onToggle }: { department: Department; editing: boolean; onToggle: () => void }) {
  const action = updateDepartmentAction.bind(null, department.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text">
            {department.name}
            {department.code && <span className="ml-2 font-mono text-xs font-normal text-text-muted">{department.code}</span>}
          </p>
          <p className="text-xs text-text-muted">
            {department.hodStaffId ? `HOD: ${department.hodStaffId}` : "No HOD assigned"}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={department.status === "ACTIVE" ? "success" : "pending"} label={department.status} />
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>
      {editing && (
        <form action={formAction} className="mt-2.5 flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
          {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Name" name="name" disabled={isPending} defaultValue={department.name} />
            <Field label="Code" name="code" disabled={isPending} defaultValue={department.code ?? ""} />
            <Field label="HOD staff ID" name="hodStaffId" disabled={isPending} defaultValue={department.hodStaffId ?? ""} />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Status</span>
              <select
                name="status"
                disabled={isPending}
                defaultValue={department.status}
                className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text outline-none focus:border-primary"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
          </div>
          <button type="submit" disabled={isPending} className="w-fit rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </li>
  );
}
