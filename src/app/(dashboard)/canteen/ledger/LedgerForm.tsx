"use client";

// The canteen counter's whole workflow, exactly as specified: staff enters
// an amount, presses "Move to ledger", then a loading state represents
// waiting for the NFC card tap that will identify the student. No physical
// reader is connected yet, so this stage doubles as the simulation: staff
// searches and picks the student themselves (via /api/canteen/search),
// which stands in for the real card tap that will drive this exact same
// step once a reader exists -- nothing about the flow after this stage
// changes when that happens, only how the studentId gets chosen. Picking a
// student immediately fires the real charge (/api/canteen/charge, real
// atomic wallet debit), shows a second loading state while it runs, then
// the success receipt (amount deducted + new balance) or a real error
// (insufficient balance, frozen wallet, etc.) verbatim from the backend.
// Closing the receipt resets the form; the charge itself is already
// permanently recorded (History reads the same real canteen_transaction
// rows this just wrote).
//
// Tailwind classes here use arbitrary-value syntax (e.g. bg-[var(--can-primary)])
// pointing at the exact same --can-* tokens (canteen-theme.css) the rest of
// the module uses, instead of the sitewide --color-primary/--color-border/
// etc tokens the plain Tailwind utilities (bg-primary, border-border) would
// otherwise resolve to -- those are a visibly different blue (#2b6fe0
// sitewide vs #1d4ed8 here), so a literal "same color" replication needed
// this swapped everywhere, not just in the Shell/Dashboard/History.

import { useEffect, useRef, useState } from "react";
import { formatMoneyDetail } from "@/lib/format";
import type { CanteenChargeReceipt, CanteenStudent } from "@/lib/canteen-api";

type Stage = "amount" | "waiting" | "charging" | "success" | "error";

export function LedgerForm() {
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<Stage>("amount");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CanteenStudent[]>([]);
  const [searching, setSearching] = useState(false);
  const [receipt, setReceipt] = useState<CanteenChargeReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const amountPaise = Math.round((parseFloat(amount) || 0) * 100);
  const canSubmit = amountPaise > 0;

  useEffect(() => {
    if (stage !== "waiting") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/canteen/search?query=${encodeURIComponent(query)}`);
        const body = await res.json().catch(() => null);
        setResults(res.ok && body?.data ? body.data : []);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, stage]);

  function moveToLedger() {
    if (!canSubmit) return;
    setQuery("");
    setResults([]);
    setError(null);
    setStage("waiting");
  }

  async function simulateCardTap(student: CanteenStudent) {
    setStage("charging");
    setError(null);
    try {
      // Fresh per request, never reused across a different student/amount --
      // this exists to make a genuine network-level retry of THIS exact
      // request safe (the backend replays the original result instead of
      // double-charging), not to cover a business-level "try again" after a
      // failure, which may well be for a different student. Same real
      // convention this app already uses for payments/messaging (see
      // finance/payments/actions.ts, faculty/message's ConversationClient.tsx).
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch("/api/canteen/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, amountPaise, idempotencyKey }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.message ?? "Could not complete this charge.");
        setStage("error");
        return;
      }
      setReceipt(body.data as CanteenChargeReceipt);
      setStage("success");
    } catch {
      setError("Could not reach the server.");
      setStage("error");
    }
  }

  function closeAndReset() {
    setStage("amount");
    setAmount("");
    setReceipt(null);
    setError(null);
    setQuery("");
    setResults([]);
  }

  return (
    <div className="mx-auto max-w-[520px] rounded-[14px] border border-[var(--can-border)] bg-[var(--can-white)] p-7">
      {stage === "amount" && (
        <>
          <p className="text-[15px] font-bold text-[var(--can-ink)]">New canteen charge</p>
          <p className="mt-1 text-[13px] text-[var(--can-body-muted)]">
            Enter the purchase amount, then tap Move to ledger to identify the student and charge their wallet.
          </p>
          <label className="mt-6 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--can-body-muted)]">
            Amount
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-[11px] border border-[var(--can-border)] bg-[var(--can-panel)] px-4 py-3">
            <span className="text-[16px] font-bold text-[var(--can-body-muted)]">₹</span>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-[20px] font-extrabold text-[var(--can-ink)] outline-none placeholder:text-[var(--can-tertiary)]"
            />
          </div>
          <button
            type="button"
            onClick={moveToLedger}
            disabled={!canSubmit}
            className="mt-6 w-full rounded-[11px] bg-[var(--can-primary)] py-3 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Move to ledger
          </button>
        </>
      )}

      {stage === "waiting" && (
        <>
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-[var(--can-border)] border-t-[var(--can-primary)]" />
            <p className="text-[15px] font-bold text-[var(--can-ink)]">Waiting for card…</p>
            <p className="max-w-[360px] text-[13px] text-[var(--can-body-muted)]">
              No NFC reader is connected yet — search for the student below to simulate the card tap.
            </p>
          </div>
          <div className="mt-5">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or admission number…"
              className="w-full rounded-[11px] border border-[var(--can-border)] bg-[var(--can-panel)] px-4 py-2.5 text-[14px] text-[var(--can-ink)] outline-none focus:border-[var(--can-primary)]"
            />
            <div className="mt-3 max-h-[280px] overflow-y-auto rounded-[11px] border border-[var(--can-border)]">
              {searching && <div className="px-4 py-3 text-[13px] text-[var(--can-body-muted)]">Searching…</div>}
              {!searching && query.trim().length >= 2 && results.length === 0 && (
                <div className="px-4 py-3 text-[13px] text-[var(--can-body-muted)]">No matching students.</div>
              )}
              {!searching &&
                results.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => simulateCardTap(s)}
                    disabled={!s.hasWallet || !s.walletActive}
                    className="flex w-full items-center justify-between gap-3 border-b border-[var(--can-border)] px-4 py-3 text-left last:border-b-0 hover:bg-[var(--can-tint)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span>
                      <span className="block text-[14px] font-semibold text-[var(--can-ink)]">{s.name}</span>
                      <span className="block text-[12px] text-[var(--can-body-muted)]">
                        {s.admissionNo}
                        {s.gradeName ? ` · ${s.gradeName}${s.sectionName ? `-${s.sectionName}` : ""}` : ""}
                      </span>
                    </span>
                    <span className="text-right text-[12.5px] font-semibold text-[var(--can-body-muted)]">
                      {!s.hasWallet ? "No wallet" : !s.walletActive ? "Frozen" : formatMoneyDetail(s.balancePaise ?? 0)}
                    </span>
                  </button>
                ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStage("amount")}
            className="mt-4 w-full rounded-[11px] border border-[var(--can-border)] py-2.5 text-[13.5px] font-semibold text-[var(--can-body-muted)] hover:bg-[var(--can-tint)]"
          >
            Cancel
          </button>
        </>
      )}

      {stage === "charging" && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-[var(--can-border)] border-t-[var(--can-primary)]" />
          <p className="text-[15px] font-bold text-[var(--can-ink)]">Posting to ledger…</p>
          <p className="text-[13px] text-[var(--can-body-muted)]">Charging the student&rsquo;s wallet.</p>
        </div>
      )}

      {stage === "success" && receipt && (
        <div className="flex flex-col items-center gap-1 py-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--can-green-bg)] text-[var(--can-green-text)]">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <p className="mt-3 text-[16px] font-bold text-[var(--can-ink)]">Charged successfully</p>
          <p className="text-[13px] text-[var(--can-body-muted)]">{receipt.studentName} · {receipt.admissionNo}</p>

          <div className="mt-5 w-full rounded-[11px] border border-[var(--can-border)] bg-[var(--can-panel)] p-4 text-left">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[13px] text-[var(--can-body-muted)]">Amount deducted</span>
              <span className="text-[14.5px] font-bold text-[var(--can-red-text)]">-{formatMoneyDetail(receipt.amountPaise)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--can-border)] py-1.5 pt-2.5">
              <span className="text-[13px] text-[var(--can-body-muted)]">Remaining balance</span>
              <span className="text-[14.5px] font-bold text-[var(--can-ink)]">{formatMoneyDetail(receipt.balanceAfterPaise)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAndReset}
            className="mt-6 w-full rounded-[11px] bg-[var(--can-primary)] py-3 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90"
          >
            Close
          </button>
        </div>
      )}

      {stage === "error" && (
        <div className="flex flex-col items-center gap-1 py-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--can-red-bg)] text-[var(--can-red-text)]">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </span>
          <p className="mt-3 text-[15px] font-bold text-[var(--can-ink)]">Could not complete this charge</p>
          <p className="mt-1 max-w-[360px] text-[13px] text-[var(--can-body-muted)]">{error}</p>
          <button
            type="button"
            onClick={() => setStage("waiting")}
            className="mt-6 w-full rounded-[11px] bg-[var(--can-primary)] py-3 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={closeAndReset}
            className="mt-2 w-full rounded-[11px] border border-[var(--can-border)] py-2.5 text-[13.5px] font-semibold text-[var(--can-body-muted)] hover:bg-[var(--can-tint)]"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
