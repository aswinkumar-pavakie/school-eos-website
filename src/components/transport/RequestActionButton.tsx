"use client";

// The real "request X, Admin decides" trigger reused for all 4 delete-
// equivalent actions (vehicle/route deactivation, route-stop deletion,
// student-allocation removal) -- each submits a real approval_request via
// the generic approvals engine; nothing changes until an ADMIN approves it.
// TRANSPORT_MANAGER can't query their own submitted requests anywhere in
// this backend (see transport-manager/actions.ts's own comment on why), so
// there's no real "still pending" badge that survives a page refresh --
// this shows a real one-time confirmation from the action's own successful
// response instead of a fabricated persistent one.

import { cloneElement, isValidElement, useActionState, useEffect, useState, type ReactElement } from "react";
import type { FormActionState } from "@/app/(dashboard)/transport-manager/actions";
import { Field } from "./shared";

const initialState: FormActionState = {};

type Action = (prev: FormActionState, formData: FormData) => Promise<FormActionState>;

export function RequestActionButton({
  action,
  children,
  confirmTitle,
  confirmBody,
  submitLabel,
  submittedLabel,
}: {
  action: Action;
  /** The idle trigger's own rendered markup (a plain element, e.g. a
   * `<button>` or `<VehicleDeleteTrigger/>`, with no onClick of its own) --
   * a plain child element, not a render function, because this component is
   * used from Server Component pages and a function prop can't cross that
   * boundary (functions aren't serializable). The real click handler is
   * attached here via cloneElement instead, so one child markup shape still
   * serves both the icon-only 32px buttons (Routes rows, per-student rows)
   * and the larger text+icon buttons (bus/route detail headers) already
   * established elsewhere in this role. */
  children: ReactElement;
  confirmTitle: string;
  confirmBody: string;
  submitLabel: string;
  submittedLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!isPending && !state.error && state !== initialState) {
      setOpen(false);
      setSubmitted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending]);

  if (submitted) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[12.5px] font-semibold"
        style={{ background: "#EFF4FF", color: "#1E3A8A" }}
      >
        {submittedLabel}
      </span>
    );
  }

  if (!open) {
    return isValidElement<{ onClick?: (e: React.MouseEvent) => void }>(children)
      ? cloneElement(children, {
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            setOpen(true);
          },
        })
      : children;
  }

  return (
    <div
      className="flex flex-col gap-2.5 rounded-[11px] p-3.5"
      style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div>
        <p className="text-[13px] font-bold text-text">{confirmTitle}</p>
        <p className="mt-0.5 text-[12.5px] text-text-muted">{confirmBody}</p>
      </div>
      {state.error && <p className="rounded-[9px] bg-critical-bg px-2.5 py-1.5 text-[12.5px] text-critical-text">{state.error}</p>}
      <form action={formAction} className="flex flex-col gap-2.5">
        <Field label="Reason (optional)" name="reason" disabled={isPending} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
            }}
            className="rounded-[9px] border border-border px-3 py-1.5 text-[12.5px] font-bold text-text hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-[9px] px-3 py-1.5 text-[12.5px] font-bold text-white disabled:opacity-60"
            style={{ background: "#1E3A8A" }}
          >
            {isPending ? "Submitting…" : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
