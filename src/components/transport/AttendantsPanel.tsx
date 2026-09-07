"use client";

import { useActionState, useState } from "react";
import { createAttendantAction, updateAttendantAction, type FormActionState } from "@/app/(dashboard)/admin/transport/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, PanelCreateForm, SelectField } from "./shared";

export interface Attendant {
  id: string;
  fullName: string;
  phone: string | null;
  status: string;
}

const initialState: FormActionState = {};

export function AttendantsPanel({ attendants }: { attendants: Attendant[] }) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createAttendantAction, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{attendants.length} attendants</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New attendant
          </button>
        )}
      </div>
      {adding && (
        <PanelCreateForm title="New attendant" onCancel={() => setAdding(false)} formAction={formAction} isPending={isPending} error={state.error} submitLabel="Create">
          <Field label="Full name" name="fullName" required disabled={isPending} />
          <Field label="Phone" name="phone" disabled={isPending} />
        </PanelCreateForm>
      )}
      <ul className="mt-4 flex flex-col divide-y divide-border">
        {attendants.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No attendants yet.</li>}
        {attendants.map((attendant) => (
          <AttendantRow key={attendant.id} attendant={attendant} editing={editingId === attendant.id} onToggle={() => setEditingId((v) => (v === attendant.id ? null : attendant.id))} />
        ))}
      </ul>
    </div>
  );
}

function AttendantRow({ attendant, editing, onToggle }: { attendant: Attendant; editing: boolean; onToggle: () => void }) {
  const action = updateAttendantAction.bind(null, attendant.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text">{attendant.fullName}</p>
          <p className="text-xs text-text-muted">{attendant.phone ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={attendant.status === "ACTIVE" ? "success" : "pending"} label={attendant.status} />
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>
      {editing && (
        <form action={formAction} className="mt-2.5 flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
          {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Full name" name="fullName" disabled={isPending} defaultValue={attendant.fullName} />
            <Field label="Phone" name="phone" disabled={isPending} defaultValue={attendant.phone ?? undefined} />
            <SelectField
              label="Status"
              name="status"
              disabled={isPending}
              defaultValue={attendant.status}
              options={[
                ["ACTIVE", "Active"],
                ["INACTIVE", "Inactive"],
              ]}
            />
          </div>
          <button type="submit" disabled={isPending} className="w-fit rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </li>
  );
}
