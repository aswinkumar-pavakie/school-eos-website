"use client";

// Design Architecture v0.1 component 22 (Confirmation dialog). Irreversible -- no
// path back off EXITED exists on the backend.

import { useActionState, useState } from "react";
import { exitStaffAction, type FormActionState } from "@/app/(dashboard)/admin/faculty/actions";

const initialState: FormActionState = {};

export function ExitStaffDialog({ staffId }: { staffId: string }) {
  const [open, setOpen] = useState(false);
  const action = exitStaffAction.bind(null, staffId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[11px] border border-critical-text/30 px-4 py-2.5 text-sm font-bold text-critical-text transition-colors hover:bg-critical-bg"
      >
        Mark as exited
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/45 px-4">
          <div className="w-full max-w-[420px] rounded-[16px] bg-surface p-6 shadow-lg">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Mark this staff member as exited</h2>
            <p className="mt-1.5 text-sm text-text-muted">
              This is irreversible — there is no way to reactivate the record afterward.
            </p>

            {state.error && (
              <p className="mt-3 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm font-medium text-critical-text">
                {state.error}
              </p>
            )}

            <form action={formAction} className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">Exit reason *</span>
                <select
                  name="exitReason"
                  required
                  disabled={isPending}
                  defaultValue=""
                  className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
                >
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="RESIGNED">Resigned</option>
                  <option value="RETIRED">Retired</option>
                  <option value="TRANSFERRED">Transferred</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">Date of exit</span>
                <input
                  type="date"
                  name="dateOfExit"
                  disabled={isPending}
                  className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
                />
                <span className="text-xs text-text-muted">Defaults to today if left blank.</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-[11px] border border-border px-4 py-2.5 text-sm font-bold text-text hover:bg-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-[11px] bg-critical-text px-4 py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-60"
                >
                  {isPending ? "Confirming…" : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
