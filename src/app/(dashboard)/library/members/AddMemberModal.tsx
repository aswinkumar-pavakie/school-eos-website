"use client";

import { useActionState, useState } from "react";
import { createMemberAction, type FormActionState } from "./actions";
import { EligibleMemberPicker } from "./EligibleMemberPicker";
import type { EligiblePerson } from "@/lib/library-api";

const initialState: FormActionState = {};

export function AddMemberModal({ eligiblePeople }: { eligiblePeople: EligiblePerson[] }) {
  const [open, setOpen] = useState(false);
  const [person, setPerson] = useState<EligiblePerson | null>(null);
  const action = createMemberAction.bind(null, person?.personId ?? "");
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,111,224,.25)] transition-opacity hover:opacity-90"
      >
        + Add member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#101828]/45 px-4 py-10">
          <div className="w-full max-w-[480px] rounded-[16px] bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Add Library member</h2>
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
              <EligibleMemberPicker people={eligiblePeople} onSelect={setPerson} disabled={isPending} />

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">
                  Member type <span className="text-critical-text">*</span>
                </span>
                <select
                  name="memberType"
                  required
                  disabled={isPending}
                  defaultValue=""
                  className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
                >
                  <option value="" disabled>Select…</option>
                  <option value="STUDENT">Student</option>
                  <option value="STAFF">Staff</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">Max books allowed (optional)</span>
                <input
                  name="maxBooksAllowed"
                  type="number"
                  min={1}
                  disabled={isPending}
                  placeholder="Uses the Library default if left blank"
                  className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
                />
              </label>

              <button
                type="submit"
                disabled={isPending || !person}
                className="mt-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {isPending ? "Adding…" : "Add member"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
