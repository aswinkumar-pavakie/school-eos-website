"use client";

import { useActionState, useState } from "react";
import {
  createRetentionPolicyAction,
  updateRetentionPolicyAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/settings/actions";
import { Field, PanelCreateForm } from "./shared";

export interface RetentionPolicy {
  category: string;
  description: string | null;
  isPermanent: boolean;
  retentionYears: number | null;
  anchor: string | null;
  graceDays: number | null;
  isRestricted: boolean;
}

const initialState: FormActionState = {};

function PermanentAwareFields({ policy }: { policy?: RetentionPolicy }) {
  const [isPermanent, setIsPermanent] = useState(policy?.isPermanent ?? false);

  return (
    <>
      <label className="col-span-2 flex items-center gap-2 text-sm font-semibold text-text">
        <input
          type="checkbox"
          name="isPermanent"
          defaultChecked={policy?.isPermanent}
          onChange={(e) => setIsPermanent(e.target.checked)}
        />
        Retain permanently (never disposed)
      </label>
      <Field
        label="Retention years"
        name="retentionYears"
        type="number"
        min={1}
        disabled={isPermanent}
        defaultValue={policy?.retentionYears ?? undefined}
      />
      <Field label="Anchor" name="anchor" placeholder="e.g. record_creation" defaultValue={policy?.anchor ?? ""} />
      <Field
        label="Grace days"
        name="graceDays"
        type="number"
        min={0}
        defaultValue={policy?.graceDays ?? undefined}
      />
      <label className="col-span-2 flex items-center gap-2 text-sm font-semibold text-text">
        <input type="checkbox" name="isRestricted" defaultChecked={policy?.isRestricted} />
        Restricted access
      </label>
    </>
  );
}

function EditPolicyRow({ policy }: { policy: RetentionPolicy }) {
  const [open, setOpen] = useState(false);
  const boundAction = updateRetentionPolicyAction.bind(null, policy.category);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <div className="border-t border-border px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-text">{policy.category}</p>
          <p className="text-xs text-text-muted">{policy.description || "—"}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-text-muted">
          <span>{policy.isPermanent ? "Permanent" : `${policy.retentionYears ?? "—"} yrs`}</span>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-[11px] border border-border px-3 py-1.5 text-xs font-bold text-text hover:bg-surface"
          >
            {open ? "Close" : "Manage"}
          </button>
        </div>
      </div>
      {open && (
        <PanelCreateForm
          title={`Edit ${policy.category}`}
          onCancel={() => setOpen(false)}
          formAction={formAction}
          isPending={isPending}
          error={state.error}
          submitLabel="Save"
        >
          <Field label="Description" name="description" defaultValue={policy.description ?? ""} />
          <PermanentAwareFields policy={policy} />
        </PanelCreateForm>
      )}
    </div>
  );
}

function CreatePolicyForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createRetentionPolicyAction, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-fit rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white"
      >
        Add retention policy
      </button>
    );
  }

  return (
    <PanelCreateForm
      title="New retention policy"
      onCancel={() => setOpen(false)}
      formAction={formAction}
      isPending={isPending}
      error={state.error}
      submitLabel="Create"
    >
      <Field label="Category" name="category" required placeholder="e.g. ADMISSION_DOCUMENTS" />
      <Field label="Description" name="description" />
      <PermanentAwareFields />
    </PanelCreateForm>
  );
}

export function RetentionPoliciesPanel({ policies }: { policies: RetentionPolicy[] }) {
  return (
    <div className="flex flex-col gap-4">
      <CreatePolicyForm />
      <div className="overflow-hidden rounded-[11px] border border-border">
        {policies.length === 0 && <p className="px-3.5 py-6 text-center text-text-muted">No retention policies found.</p>}
        {policies.map((policy) => (
          <EditPolicyRow key={policy.category} policy={policy} />
        ))}
      </div>
    </div>
  );
}
