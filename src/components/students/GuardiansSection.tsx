"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createGuardianAction,
  revokeGuardianAction,
  setPrimaryGuardianAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/students/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { CreateParentModal } from "@/components/parents/CreateParentModal";
import { GuardianPersonPicker } from "@/components/students/GuardianPersonPicker";

interface GuardianRow {
  id: string;
  personId: string;
  firstName: string;
  lastName: string | null;
  relationship: string;
  isPrimaryContact: boolean;
  accessLevel: string;
  isAuthorisedPickup: boolean;
  occupation: string | null;
  status: string;
}

const initialState: FormActionState = {};

export function GuardiansSection({ studentId, guardians }: { studentId: string; guardians: GuardianRow[] }) {
  const [adding, setAdding] = useState(false);
  const action = createGuardianAction.bind(null, studentId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  const active = guardians.filter((g) => g.status === "ACTIVE");
  const revoked = guardians.filter((g) => g.status !== "ACTIVE");

  return (
    <div className="mt-4">
      {active.length === 0 && (
        <p className="rounded-[11px] border border-dashed border-border bg-field px-3.5 py-3 text-sm text-text-muted">
          No guardian linked yet.
        </p>
      )}

      <ul className="flex flex-col divide-y divide-border">
        {active.map((g) => (
          <GuardianRowItem key={g.id} studentId={studentId} guardian={g} />
        ))}
      </ul>

      {revoked.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[13px] font-semibold text-text-muted">
            {revoked.length} revoked
          </summary>
          <ul className="mt-2 flex flex-col divide-y divide-border opacity-60">
            {revoked.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                <span>
                  {g.firstName} {g.lastName ?? ""} · {g.relationship.toLowerCase()}
                </span>
                <StatusPill tone="critical" label="Revoked" />
              </li>
            ))}
          </ul>
        </details>
      )}

      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 text-[13px] font-semibold text-primary"
        >
          + Link guardian
        </button>
      ) : (
        <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
          {state.error && (
            <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
          )}
          <div className="flex items-center justify-between gap-3">
            <GuardianPersonPicker disabled={isPending} />
            <CreateParentModal
              presetStudent={{ id: studentId, label: "This new parent will be linked to this student." }}
              triggerLabel="Not found — create new parent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Relationship *</span>
              <select
                name="relationship"
                required
                disabled={isPending}
                defaultValue=""
                className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
              >
                <option value="" disabled>
                  Select
                </option>
                <option value="FATHER">Father</option>
                <option value="MOTHER">Mother</option>
                <option value="GUARDIAN">Guardian</option>
                <option value="GRANDPARENT">Grandparent</option>
                <option value="SIBLING">Sibling</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Occupation</span>
              <input
                name="occupation"
                disabled={isPending}
                className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-text">
            <input type="checkbox" name="isPrimaryContact" disabled={isPending} className="h-4 w-4 rounded border-border" />
            Make this the primary contact
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isPending ? "Linking…" : "Link guardian"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function GuardianRowItem({ studentId, guardian }: { studentId: string; guardian: GuardianRow }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div>
        <p className="text-[13.5px] font-semibold text-text">
          {guardian.firstName} {guardian.lastName ?? ""}
          {guardian.isPrimaryContact && (
            <span className="ml-2 text-xs font-bold text-primary">PRIMARY</span>
          )}
        </p>
        <p className="text-xs text-text-muted">
          {guardian.relationship.toLowerCase()} · {guardian.accessLevel.toLowerCase().replace(/_/g, " ")}
          {guardian.occupation ? ` · ${guardian.occupation}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {!guardian.isPrimaryContact && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => setPrimaryGuardianAction(studentId, guardian.id))}
            className="text-[13px] font-semibold text-primary disabled:opacity-60"
          >
            Set primary
          </button>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => revokeGuardianAction(studentId, guardian.id))}
          className="text-[13px] font-semibold text-critical-text disabled:opacity-60"
        >
          Revoke
        </button>
      </div>
    </li>
  );
}
