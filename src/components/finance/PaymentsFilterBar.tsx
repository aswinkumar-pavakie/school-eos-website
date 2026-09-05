"use client";

// Payments filter row -- search + Payment status + Mode, auto-submitting.

import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";

const MODES: [string, string][] = [
  ["UPI", "UPI"],
  ["CARD", "Card"],
  ["NETBANKING", "Netbanking"],
  ["CASH", "Cash"],
  ["CHEQUE", "Cheque"],
  ["DD", "DD"],
  ["WALLET_TOPUP", "Wallet top-up"],
];

export function PaymentsFilterBar({ search, state, mode }: { search: string; state: string; mode: string }) {
  return (
    <form action="/admin/finance/payments" className="mt-6 flex flex-wrap items-end gap-3">
      <AutoSubmitSearchInput
        type="search"
        name="search"
        defaultValue={search}
        placeholder="Search by student, receipt no., or reference…"
        className="w-full max-w-md rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      />
      <AutoSubmitSelect
        name="state"
        defaultValue={state}
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      >
        <option value="">All statuses</option>
        <option value="INITIATED">Initiated</option>
        <option value="PENDING">Pending</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="FAILED">Failed</option>
        <option value="RECONCILED">Reconciled</option>
        <option value="REVERSED">Reversed</option>
      </AutoSubmitSelect>
      <AutoSubmitSelect
        name="mode"
        defaultValue={mode}
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      >
        <option value="">All payment modes</option>
        {MODES.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </AutoSubmitSelect>
    </form>
  );
}
