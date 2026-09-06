"use client";

import { useActionState } from "react";
import { updateLibraryConfigAction, type FormActionState } from "./actions";
import { Field } from "@/components/dashboard/FormFields";
import type { LibraryConfig } from "@/lib/library-api";

const initialState: FormActionState = {};

export function ConfigurationForm({ config }: { config: LibraryConfig }) {
  const [state, formAction, isPending] = useActionState(updateLibraryConfigAction, initialState);
  const finePerDayRupees = Number(BigInt(config.finePerDayPaise)) / 100;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error && (
        <p role="alert" className="rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm font-medium text-critical-text">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-[11px] bg-success-bg px-3.5 py-2.5 text-sm font-medium text-success-text">
          Configuration saved.
        </p>
      )}

      <section className="rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Circulation rules</h2>
        <p className="mt-1 text-[13px] text-text-muted">How long a book stays out, and how many times it can be renewed.</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Loan period (days)" name="loanPeriodDays" type="number" min={1} required disabled={isPending} defaultValue={config.loanPeriodDays} />
          <Field label="Max renewals" name="maxRenewals" type="number" min={0} required disabled={isPending} defaultValue={config.maxRenewals} />
        </div>
      </section>

      <section className="rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Fine rules</h2>
        <p className="mt-1 text-[13px] text-text-muted">Applied per day overdue when a book is returned late.</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Fine per day (₹)" name="finePerDayRupees" type="number" min={0} step="0.01" required disabled={isPending} defaultValue={finePerDayRupees} />
        </div>
      </section>

      <section className="rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Reservation rules</h2>
        <p className="mt-1 text-[13px] text-text-muted">How long a returned copy is held for the next member in the reservation queue before it expires.</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Reservation hold period (days)" name="reservationHoldDays" type="number" min={1} required disabled={isPending} defaultValue={config.reservationHoldDays} />
        </div>
      </section>

      <section className="rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Operational settings</h2>
        <p className="mt-1 text-[13px] text-text-muted">Default applied to a member when they're added, unless overridden on their own profile.</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Max books per member" name="maxBooksPerMember" type="number" min={1} required disabled={isPending} defaultValue={config.maxBooksPerMember} />
        </div>
      </section>

      <button type="submit" disabled={isPending} className="self-start rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
        {isPending ? "Saving…" : "Save configuration"}
      </button>
    </form>
  );
}
