"use client";

import { useActionState } from "react";
import { updateParentContactAction, type FormActionState } from "@/app/(dashboard)/admin/parents/actions";

const initialState: FormActionState = {};

export function EditParentContactForm({
  personId,
  mobile,
  email,
  loginEmail,
}: {
  personId: string;
  mobile: string | null;
  email: string | null;
  loginEmail?: string | null;
}) {
  const action = updateParentContactAction.bind(null, personId);
  const [state, formAction, isPending] = useActionState(action, initialState);
  // Contact email (this field) and the parent's login email (Login & security,
  // below) are separate columns that can drift -- if there's no contact email on
  // file but the parent does have an email login, show that instead of leaving
  // the box looking blank/broken; saving still writes to the contact email only.
  const emailDefault = email ?? loginEmail ?? "";

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-3">
      {state.error && (
        <p className="w-full rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
      )}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Mobile</span>
        <input
          name="mobile"
          defaultValue={mobile ?? ""}
          disabled={isPending}
          placeholder="10-digit mobile"
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Email</span>
        <input
          name="email"
          type="email"
          defaultValue={emailDefault}
          disabled={isPending}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
        />
        {!email && loginEmail && (
          <span className="text-xs text-text-muted">Filled from their login email — save to also set it as contact email.</span>
        )}
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-[11px] bg-primary px-3.5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save contact"}
      </button>
    </form>
  );
}
