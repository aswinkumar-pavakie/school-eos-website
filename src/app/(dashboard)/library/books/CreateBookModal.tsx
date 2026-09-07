"use client";

// New-book modal -- same shape as CreateInventoryItemModal (Design Architecture
// v0.1 component 13, 480px web).

import { useActionState, useState } from "react";
import { createBookAction, type FormActionState } from "./actions";
import { CategoriesModal } from "./CategoriesModal";
import { Field, TextAreaField } from "@/components/dashboard/FormFields";
import type { LibraryCategory } from "@/lib/library-api";

const initialState: FormActionState = {};

export function CreateBookModal({ categories }: { categories: LibraryCategory[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createBookAction, initialState);
  const activeCategories = categories.filter((c) => c.status === "ACTIVE");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,111,224,.25)] transition-opacity hover:opacity-90"
      >
        + New book
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#101828]/45 px-4 py-10">
          <div className="w-full max-w-[480px] rounded-[16px] bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">New book</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg"
              >
                ×
              </button>
            </div>

            {state.error && (
              <p role="alert" className="mt-4 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm font-medium text-critical-text">
                {state.error}
              </p>
            )}

            <form
              action={(formData) => {
                formAction(formData);
                setOpen(false);
              }}
              className="mt-4 flex flex-col gap-4"
              noValidate
            >
              <Field label="Title" name="title" required disabled={isPending} placeholder="e.g. Wings of Fire" />
              <Field label="Author" name="author" required disabled={isPending} placeholder="e.g. A. P. J. Abdul Kalam" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="ISBN" name="isbn" disabled={isPending} placeholder="Optional" />
                <Field label="Publication year" name="publicationYear" type="number" min={1000} max={2100} disabled={isPending} placeholder="Optional" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Publisher" name="publisher" disabled={isPending} placeholder="Optional" />
                <Field label="Edition" name="edition" disabled={isPending} placeholder="Optional" />
              </div>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="flex items-center justify-between font-semibold text-text">
                  Category
                  <CategoriesModal categories={categories} />
                </span>
                <select
                  name="categoryId"
                  disabled={isPending}
                  defaultValue=""
                  className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface"
                >
                  <option value="">No category</option>
                  {activeCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <Field label="Language" name="language" disabled={isPending} placeholder="e.g. English" />
              <TextAreaField label="Description" name="description" disabled={isPending} />
              <Field label="Cover image URL" name="coverImageUrl" disabled={isPending} placeholder="Optional" />

              <button
                type="submit"
                disabled={isPending}
                className="mt-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {isPending ? "Creating…" : "Create book"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
