"use client";

// Create-item modal -- same shape as CreateStudentModal (Design Architecture
// v0.1 component 13, 480px web).

import { useActionState, useState } from "react";
import { createInventoryItemAction, type FormActionState } from "@/app/(dashboard)/admin/inventory/actions";
import { Field, SelectField } from "@/components/dashboard/FormFields";

const initialState: FormActionState = {};

interface Category {
  id: string;
  name: string;
}

export function CreateInventoryItemModal({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createInventoryItemAction, initialState);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,111,224,.25)] transition-opacity hover:opacity-90"
      >
        + New item
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#101828]/45 px-4 py-10">
          <div className="w-full max-w-[480px] rounded-[16px] bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">New inventory item</h2>
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
              <p
                role="alert"
                className="mt-4 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm font-medium text-critical-text"
              >
                {state.error}
              </p>
            )}

            {categories.length === 0 ? (
              <p className="mt-4 text-sm text-text-muted">
                Add a category first (see the Categories tab) before creating an item.
              </p>
            ) : (
              <form
                action={(formData) => {
                  formAction(formData);
                  setOpen(false);
                }}
                className="mt-4 flex flex-col gap-4"
                noValidate
              >
                <Field label="Item name" name="name" required disabled={isPending} placeholder="e.g. Projector" />
                <div className="grid grid-cols-2 gap-4">
                  <SelectField
                    label="Category"
                    name="categoryId"
                    required
                    disabled={isPending}
                    options={[["", "Select"], ...categories.map((c) => [c.id, c.name] as [string, string])]}
                  />
                  <Field label="Asset code" name="assetCode" disabled={isPending} placeholder="e.g. AST-0042" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Quantity"
                    name="quantity"
                    type="number"
                    disabled={isPending}
                    defaultValue={1}
                    placeholder="1"
                  />
                  <Field
                    label="Low-stock threshold"
                    name="lowStockThreshold"
                    type="number"
                    disabled={isPending}
                    placeholder="Optional"
                  />
                </div>
                <Field label="Location" name="location" disabled={isPending} placeholder="e.g. Store Room 2" />
                <Field label="Description" name="description" disabled={isPending} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Acquisition date" name="acquisitionDate" type="date" disabled={isPending} />
                  <Field
                    label="Acquisition cost (paise)"
                    name="acquisitionCostPaise"
                    type="number"
                    disabled={isPending}
                    placeholder="Optional"
                  />
                </div>
                <Field label="Vendor" name="vendor" disabled={isPending} />

                <button
                  type="submit"
                  disabled={isPending}
                  className="mt-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {isPending ? "Creating…" : "Create item"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
