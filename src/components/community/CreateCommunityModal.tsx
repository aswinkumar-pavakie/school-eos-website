"use client";

import { useActionState, useState } from "react";
import { createCommunityAction, type FormActionState } from "@/app/(dashboard)/admin/community/actions";

const initialState: FormActionState = {};

interface AcademicYear {
  id: string;
  name: string;
}

export function CreateCommunityModal({
  years,
  defaultAcademicYearId,
}: {
  years: AcademicYear[];
  defaultAcademicYearId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createCommunityAction, initialState);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,111,224,.25)] transition-opacity hover:opacity-90"
      >
        + New community
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#101828]/45 px-4 py-10">
          <div className="w-full max-w-[480px] rounded-[16px] bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">New community</h2>
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
              <div role="alert" className="mt-4 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm font-medium text-critical-text">
                {state.error}
              </div>
            )}

            <form action={formAction} className="mt-4 flex flex-col gap-4" noValidate>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">
                  Name<span className="text-critical-text"> *</span>
                </span>
                <input
                  name="name"
                  required
                  disabled={isPending}
                  className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">
                  Category<span className="text-critical-text"> *</span>
                </span>
                <input
                  name="communityCategory"
                  required
                  placeholder="e.g. Technology, Arts, Sports"
                  disabled={isPending}
                  className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">
                  Academic year<span className="text-critical-text"> *</span>
                </span>
                <select
                  name="academicYearId"
                  required
                  disabled={isPending}
                  defaultValue={defaultAcademicYearId ?? ""}
                  className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
                >
                  <option value="" disabled>
                    Select
                  </option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">Description</span>
                <textarea
                  name="description"
                  disabled={isPending}
                  rows={2}
                  className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-semibold text-text">Max members</span>
                  <input
                    name="maxMembers"
                    type="number"
                    min={1}
                    disabled={isPending}
                    className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-semibold text-text">Moderation mode</span>
                  <select
                    name="moderationMode"
                    disabled={isPending}
                    defaultValue=""
                    className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
                  >
                    <option value="">Default</option>
                    <option value="OPEN">Open</option>
                    <option value="PRE_MODERATED">Pre-moderated</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-semibold text-text">Incharge staff ID</span>
                <input
                  name="inchargeStaffId"
                  placeholder="Existing staff UUID"
                  disabled={isPending}
                  className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 font-mono text-[13px] text-text outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60"
                />
              </label>

              <label className="flex items-center gap-2 text-[13px] text-text">
                <input type="checkbox" name="discussionEnabled" disabled={isPending} className="h-4 w-4 rounded border-border" />
                Enable discussion
              </label>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-[11px] border border-border px-4 py-2.5 text-sm font-bold text-text hover:bg-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {isPending ? "Creating…" : "Create community"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
