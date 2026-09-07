"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PlainButton } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatMoneySummary } from "@/lib/format";
import type { PaymentListItem } from "@/lib/finance-api";

/**
 * The student's own Payment History, with a real Print Receipt per row (only once a
 * receipt actually exists for that payment — offline modes generate one on
 * confirmation, DD only once cleared) and a multi-select "Print Selected" that
 * combines every ticked payment into ONE printed receipt — one header, one itemised
 * table, one grand total — instead of a separate full page per payment. For an
 * Education Loan DD payment, the reference column shows the real DD reference number
 * (gatewayRef); the "Education Loan" toggle below additionally forces the DD/loan
 * details section onto the printed receipt even for a payment not itself recorded as
 * mode DD.
 */
export function PaymentHistoryTable({ payments }: { payments: PaymentListItem[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [includeEducationLoan, setIncludeEducationLoan] = useState(false);
  const printable = payments.filter((p) => p.receiptId);
  const selectedIds = useMemo(() => Array.from(selected), [selected]);
  const eduParam = includeEducationLoan ? "&edu=1" : "";

  function toggle(receiptId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(receiptId)) next.delete(receiptId);
      else next.add(receiptId);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === printable.length ? new Set() : new Set(printable.map((p) => p.receiptId!))));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">All payments recorded against this student.</p>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-bold text-text-muted">
              <input type="checkbox" checked={includeEducationLoan} onChange={(e) => setIncludeEducationLoan(e.target.checked)} />
              Education Loan
            </label>
            <Link href={`/receipts/print?ids=${selectedIds.join(",")}${eduParam}`} target="_blank">
              <PlainButton variant="primary">Print Selected ({selectedIds.length})</PlainButton>
            </Link>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="sticky top-0 bg-field">
            <tr>
              <th className="w-10 border-b border-border px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all printable receipts"
                  checked={printable.length > 0 && selected.size === printable.length}
                  onChange={toggleAll}
                  disabled={printable.length === 0}
                />
              </th>
              <th className="border-b border-border px-4 py-3 text-left text-xs font-bold tracking-wide text-text-muted uppercase">Date</th>
              <th className="border-b border-border px-4 py-3 text-left text-xs font-bold tracking-wide text-text-muted uppercase">Mode</th>
              <th className="border-b border-border px-4 py-3 text-left text-xs font-bold tracking-wide text-text-muted uppercase">
                Reference <span className="normal-case font-normal text-text-muted">(DD no. for Education Loan)</span>
              </th>
              <th className="border-b border-border px-4 py-3 text-right text-xs font-bold tracking-wide text-text-muted uppercase">Amount</th>
              <th className="border-b border-border px-4 py-3 text-left text-xs font-bold tracking-wide text-text-muted uppercase">Status</th>
              <th className="border-b border-border px-4 py-3 text-right text-xs font-bold tracking-wide text-text-muted uppercase">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-field/60">
                <td className="px-4 py-3">
                  {p.receiptId && (
                    <input
                      type="checkbox"
                      aria-label={`Select receipt ${p.receiptNo}`}
                      checked={selected.has(p.receiptId)}
                      onChange={() => toggle(p.receiptId!)}
                    />
                  )}
                </td>
                <td className="px-4 py-3 text-text">{formatDate(p.initiatedAt)}</td>
                <td className="px-4 py-3 text-text">{p.mode}</td>
                <td className="px-4 py-3 font-mono text-text">{p.gatewayRef ?? "—"}</td>
                <td className="px-4 py-3 text-right font-mono text-text">{formatMoneySummary(p.amountPaise)}</td>
                <td className="px-4 py-3"><StatusPill state={p.state} /></td>
                <td className="px-4 py-3 text-right">
                  {p.receiptId ? (
                    <Link href={`/receipts/print?ids=${p.receiptId}`} target="_blank" className="text-xs font-bold text-primary hover:underline">
                      Print →
                    </Link>
                  ) : (
                    <span className="text-xs text-text-muted">Not yet issued</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
