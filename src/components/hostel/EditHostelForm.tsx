"use client";

import { useActionState } from "react";
import { updateHostelAction, type FormActionState } from "@/app/(dashboard)/admin/hostel/actions";
import type { Hostel } from "./HostelsPanel";

const initialState: FormActionState = {};

export function EditHostelForm({ hostel }: { hostel: Hostel }) {
  const action = updateHostelAction.bind(null, hostel.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-4">
      {state.error && (
        <p className="rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm font-medium text-critical-text">{state.error}</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Name</span>
          <input
            name="name"
            defaultValue={hostel.name}
            disabled={isPending}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Gender</span>
          <select
            name="gender"
            defaultValue={hostel.gender}
            disabled={isPending}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="MIXED">Mixed</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Capacity</span>
          <input
            name="capacity"
            type="number"
            defaultValue={hostel.capacity ?? undefined}
            disabled={isPending}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Status</span>
          <select
            name="status"
            defaultValue={hostel.status}
            disabled={isPending}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary focus:bg-surface"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-[11px] border border-border px-4 py-2 text-sm font-bold text-text transition-colors hover:bg-bg disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
