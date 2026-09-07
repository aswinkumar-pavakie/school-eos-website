"use client";

// Configurable inventory categories -- plain create + inline edit, same rhythm
// as Transport's RoutesPanel/VehiclesPanel rows.

import { useActionState, useState } from "react";
import {
  createInventoryCategoryAction,
  updateInventoryCategoryAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/inventory/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, SelectField } from "@/components/dashboard/FormFields";

export interface Category {
  id: string;
  name: string;
  status: string;
}

const initialState: FormActionState = {};

export function CategoriesPanel({ categories }: { categories: Category[] }) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createInventoryCategoryAction, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{categories.length} categories</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New category
          </button>
        )}
      </div>

      {adding && (
        <form
          action={(formData) => {
            formAction(formData);
            setAdding(false);
          }}
          className="mt-4 flex flex-wrap items-end gap-3 rounded-[11px] bg-field p-3.5"
        >
          {state.error && <span className="w-full text-xs text-critical-text">{state.error}</span>}
          <Field label="Category name" name="name" required disabled={isPending} placeholder="e.g. Laboratory equipment" />
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
              {isPending ? "Adding…" : "Add"}
            </button>
          </div>
        </form>
      )}

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {categories.length === 0 && (
          <li className="py-6 text-center text-sm text-text-muted">No categories yet -- add one above.</li>
        )}
        {categories.map((category) => (
          <CategoryRow
            key={category.id}
            category={category}
            editing={editingId === category.id}
            onToggle={() => setEditingId((v) => (v === category.id ? null : category.id))}
          />
        ))}
      </ul>
    </div>
  );
}

function CategoryRow({
  category,
  editing,
  onToggle,
}: {
  category: Category;
  editing: boolean;
  onToggle: () => void;
}) {
  const action = updateInventoryCategoryAction.bind(null, category.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13.5px] font-semibold text-text">{category.name}</p>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={category.status === "ACTIVE" ? "success" : "pending"} label={category.status} />
          <button type="button" onClick={onToggle} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>
      {editing && (
        <form action={formAction} className="mt-2.5 flex flex-wrap items-end gap-2.5 rounded-[11px] bg-field p-3">
          {state.error && <span className="w-full text-xs text-critical-text">{state.error}</span>}
          <Field label="Name" name="name" disabled={isPending} defaultValue={category.name} />
          <SelectField
            label="Status"
            name="status"
            disabled={isPending}
            defaultValue={category.status}
            options={[
              ["ACTIVE", "Active"],
              ["INACTIVE", "Inactive"],
            ]}
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </li>
  );
}
