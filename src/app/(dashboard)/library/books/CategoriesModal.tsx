"use client";

// Categories live inside the Books domain, not as their own sidebar module --
// a small modal (same shape as every other Library create/edit modal) rather
// than a full page, since managing 8-ish category names is a rare, light task.

import { useActionState, useState, useTransition } from "react";
import { createCategoryAction, updateCategoryAction, type FormActionState } from "./actions";
import { Field } from "@/components/dashboard/FormFields";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { statusLabel, statusTone } from "@/lib/format";
import type { LibraryCategory } from "@/lib/library-api";

const initialState: FormActionState = {};

export function CategoriesModal({ categories }: { categories: LibraryCategory[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createCategoryAction, initialState);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[13px] font-semibold text-primary hover:underline"
      >
        Manage categories
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#101828]/45 px-4 py-10">
          <div className="w-full max-w-[440px] rounded-[16px] bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Categories</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg">
                ×
              </button>
            </div>

            <ul className="mt-4 flex max-h-72 flex-col divide-y divide-border overflow-y-auto">
              {categories.length === 0 && (
                <li className="py-6 text-center text-sm text-text-muted">No categories yet -- add the first one below.</li>
              )}
              {categories.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))}
            </ul>

            <form
              action={formAction}
              className="mt-4 flex items-end gap-2.5 rounded-[11px] bg-field p-3.5"
              noValidate
            >
              {state.error && <span className="w-full text-xs text-critical-text">{state.error}</span>}
              <div className="flex-1">
                <Field label="New category" name="name" disabled={isPending} placeholder="e.g. Poetry" />
              </div>
              <button type="submit" disabled={isPending} className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
                {isPending ? "Adding…" : "Add"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function CategoryRow({ category }: { category: LibraryCategory }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="flex items-center gap-2 py-2.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          className="min-w-0 flex-1 rounded-[9px] border border-border bg-surface px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={isPending || !name.trim()}
          onClick={() => startTransition(async () => {
            await updateCategoryAction(category.id, { name: name.trim() });
            setEditing(false);
          })}
          className="text-[13px] font-semibold text-primary disabled:opacity-60"
        >
          Save
        </button>
        <button type="button" onClick={() => { setEditing(false); setName(category.name); }} className="text-[13px] font-semibold text-text-muted">
          Cancel
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 py-2.5">
      <span className="truncate text-sm font-semibold text-text">{category.name}</span>
      <div className="flex shrink-0 items-center gap-2.5">
        <StatusPill tone={statusTone(category.status)} label={statusLabel(category.status)} />
        <button type="button" onClick={() => setEditing(true)} className="text-[13px] font-semibold text-text-muted hover:text-text">
          Rename
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => updateCategoryAction(category.id, { status: category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }))}
          className="text-[13px] font-semibold text-critical-text disabled:opacity-60"
        >
          {category.status === "ACTIVE" ? "Deactivate" : "Activate"}
        </button>
      </div>
    </li>
  );
}
