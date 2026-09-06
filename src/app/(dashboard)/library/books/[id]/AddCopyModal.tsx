"use client";

import { useActionState, useState } from "react";
import { createCopyAction, type FormActionState } from "../actions";
import { Field } from "@/components/dashboard/FormFields";

const initialState: FormActionState = {};

export function AddCopyModal({ bookId }: { bookId: string }) {
  const [open, setOpen] = useState(false);
  const action = createCopyAction.bind(null, bookId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white hover:opacity-90"
      >
        + Add copy
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#101828]/45 px-4 py-10">
          <div className="w-full max-w-[420px] rounded-[16px] bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Add a copy</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg">
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
              <Field label="Copy code" name="copyCode" required disabled={isPending} placeholder="e.g. BK-0042-A" />
              <Field label="Shelf location" name="shelfLocation" disabled={isPending} placeholder="e.g. Rack 4, Shelf B" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Acquisition date" name="acquisitionDate" type="date" disabled={isPending} />
                <Field label="Cost (paise)" name="acquisitionCostPaise" type="number" disabled={isPending} placeholder="Optional" />
              </div>
              <button type="submit" disabled={isPending} className="mt-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {isPending ? "Adding…" : "Add copy"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
