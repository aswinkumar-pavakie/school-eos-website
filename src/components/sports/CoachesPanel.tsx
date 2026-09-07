"use client";

import { useActionState, useState } from "react";
import { createCoachAction, updateCoachAction, type FormActionState } from "@/app/(dashboard)/admin/sports/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field } from "./shared";

export interface Coach {
  id: string;
  personId: string | null;
  fullName: string;
  isExternal: boolean;
  contactPhone: string | null;
  qualification: string | null;
  policeVerificationRef: string | null;
  verificationExpiry: string | null;
  status: string;
}

const initialState: FormActionState = {};

export function CoachesPanel({ coaches }: { coaches: Coach[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{coaches.length} coaches</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New coach
          </button>
        )}
      </div>

      {adding && <CreateCoachForm onCancel={() => setAdding(false)} />}

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {coaches.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No coaches yet.</li>}
        {coaches.map((coach) => (
          <li key={coach.id} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[13.5px] font-semibold text-text">{coach.fullName}</p>
                <p className="text-xs text-text-muted">
                  {coach.isExternal ? "External" : "Internal staff"}
                  {coach.qualification ? ` · ${coach.qualification}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <StatusPill tone={coach.status === "ACTIVE" ? "success" : "pending"} label={coach.status} />
                <button
                  type="button"
                  onClick={() => setEditingId((v) => (v === coach.id ? null : coach.id))}
                  className="text-[13px] font-semibold text-primary"
                >
                  {editingId === coach.id ? "Cancel" : "Edit"}
                </button>
              </div>
            </div>
            {editingId === coach.id && <EditCoachForm coach={coach} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreateCoachForm({ onCancel }: { onCancel: () => void }) {
  const [state, formAction, isPending] = useActionState(createCoachAction, initialState);
  const [isExternal, setIsExternal] = useState(false);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
      <p className="text-[13px] font-bold text-text">New coach</p>
      {state.error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>}
      <label className="flex items-center gap-2 text-[13px] text-text">
        <input
          type="checkbox"
          name="isExternal"
          checked={isExternal}
          onChange={(e) => setIsExternal(e.target.checked)}
          disabled={isPending}
          className="h-4 w-4 rounded border-border"
        />
        External coach (not a school staff member)
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Full name" name="fullName" required disabled={isPending} />
        <Field
          label="Person ID (staff)"
          name="personId"
          required={!isExternal}
          disabled={isPending || isExternal}
          placeholder={isExternal ? "Not required for external coaches" : "Existing person UUID"}
        />
        <Field label="Contact phone" name="contactPhone" disabled={isPending} />
        <Field label="Qualification" name="qualification" disabled={isPending} />
        <Field label="Police verification ref." name="policeVerificationRef" disabled={isPending} />
        <Field label="Verification expiry" name="verificationExpiry" type="date" disabled={isPending} />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Create"}
        </button>
      </div>
    </form>
  );
}

function EditCoachForm({ coach }: { coach: Coach }) {
  const action = updateCoachAction.bind(null, coach.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [isExternal, setIsExternal] = useState(coach.isExternal);

  return (
    <form action={formAction} className="mt-2.5 flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
      {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
      <label className="flex items-center gap-2 text-[13px] text-text">
        <input
          type="checkbox"
          name="isExternal"
          checked={isExternal}
          onChange={(e) => setIsExternal(e.target.checked)}
          disabled={isPending}
          className="h-4 w-4 rounded border-border"
        />
        External coach
      </label>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Full name" name="fullName" disabled={isPending} defaultValue={coach.fullName} />
        <Field
          label="Person ID (staff)"
          name="personId"
          disabled={isPending || isExternal}
          defaultValue={coach.personId ?? ""}
        />
        <Field label="Contact phone" name="contactPhone" disabled={isPending} defaultValue={coach.contactPhone ?? ""} />
        <Field label="Qualification" name="qualification" disabled={isPending} defaultValue={coach.qualification ?? ""} />
        <select
          name="status"
          defaultValue={coach.status}
          disabled={isPending}
          className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
