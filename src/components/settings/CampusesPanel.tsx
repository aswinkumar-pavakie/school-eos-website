"use client";

import { useActionState, useState, useTransition } from "react";
import { StatusPill } from "@/components/dashboard/StatusPill";
import {
  createCampusAction,
  updateCampusAction,
  setPrimaryCampusAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/organization/actions";
import { Field } from "./shared";

export interface Campus {
  id: string;
  name: string;
  code: string;
  address: string | null;
  isPrimary: boolean;
  status: string;
}

const initialState: FormActionState = {};

export function CampusesPanel({ campuses }: { campuses: Campus[] }) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createCampusAction, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{campuses.length} campuses</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New campus
          </button>
        )}
      </div>

      {adding && (
        <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
          {state.error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" name="name" required disabled={isPending} />
            <Field label="Code" name="code" required disabled={isPending} />
            <Field label="Address" name="address" disabled={isPending} />
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
        {campuses.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No campuses yet.</li>}
        {campuses.map((c) => (
          <CampusRow key={c.id} campus={c} editing={editingId === c.id} onToggle={() => setEditingId((v) => (v === c.id ? null : c.id))} />
        ))}
      </ul>
    </div>
  );
}

function CampusRow({ campus, editing, onToggle }: { campus: Campus; editing: boolean; onToggle: () => void }) {
  const action = updateCampusAction.bind(null, campus.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [isPendingPrimary, startTransition] = useTransition();
  const [primaryError, setPrimaryError] = useState<string | null>(null);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text">
            {campus.name} <span className="font-mono text-xs font-normal text-text-muted">{campus.code}</span>
            {campus.isPrimary && <span className="ml-2 text-xs font-bold text-primary">PRIMARY</span>}
          </p>
          <p className="text-xs text-text-muted">{campus.address ?? "No address on file"}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={campus.status === "ACTIVE" ? "success" : "pending"} label={campus.status} />
          {!campus.isPrimary && (
            <button
              type="button"
              disabled={isPendingPrimary}
              onClick={() =>
                startTransition(async () => {
                  setPrimaryError(null);
                  const result = await setPrimaryCampusAction(campus.id);
                  if (result.error) setPrimaryError(result.error);
                })
              }
              className="text-[13px] font-semibold text-primary disabled:opacity-60"
            >
              Set primary
            </button>
          )}
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>
      {primaryError && <p className="mt-1 text-xs font-medium text-critical-text">{primaryError}</p>}
      {editing && (
        <form action={formAction} className="mt-2.5 flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
          {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Name" name="name" disabled={isPending} defaultValue={campus.name} />
            <Field label="Code" name="code" disabled={isPending} defaultValue={campus.code} />
            <Field label="Address" name="address" disabled={isPending} defaultValue={campus.address ?? ""} />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Status</span>
              <select
                name="status"
                disabled={isPending}
                defaultValue={campus.status}
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
