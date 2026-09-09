"use client";

import { useActionState, useRef } from "react";
import { markRecordAction, type FormState } from "./actions";

const initial: FormState = {};
const STATUSES = ["PRESENT", "ABSENT", "LATE", "HALF_DAY"] as const;

/** One student's attendance status, auto-saving on change -- a native
 * <select> inside its own tiny Server-Action-backed form, the same
 * auto-submit mechanic AutoSubmitSelect uses for GET filters, applied here
 * to a real per-row write instead. */
export function StatusSelect({ recordId, sectionId, status }: { recordId: string; sectionId: string; status: string }) {
  const [state, formAction] = useActionState(markRecordAction.bind(null, recordId, sectionId), initial);
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={formAction} className="inline-flex flex-col items-end gap-1">
      <select
        name="status"
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-[var(--radius-input)] border border-border bg-field px-2.5 py-1.5 text-xs font-semibold text-text outline-none focus:border-primary"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s.replace("_", " ")}</option>
        ))}
      </select>
      {state.error ? <span className="text-[11px] font-medium text-critical-text">{state.error}</span> : null}
    </form>
  );
}
