"use client";

// The canteen counter's whole workflow: pick products + quantities (the
// real sale), review the auto-computed total (editable -- a discount or
// rounding correction), press "Move to ledger", then a loading state
// represents waiting for the NFC card tap that will identify the student.
// No physical reader is connected yet, so this stage doubles as the
// simulation: staff searches and picks the student themselves (via
// /api/canteen/search), which stands in for the real card tap that will
// drive this exact same step once a reader exists -- nothing about the
// flow after this stage changes when that happens, only how the studentId
// gets chosen. Picking a student immediately fires the real charge
// (/api/canteen/charge, real atomic wallet debit + inventory decrement),
// shows a second loading state while it runs, then the success receipt
// (items bought + amount deducted + new balance) or a real error
// (insufficient balance, frozen wallet, out of stock, etc.) verbatim from
// the backend. Closing the receipt resets the form; the charge itself is
// already permanently recorded (History reads the same real
// canteen_transaction/canteen_transaction_item rows this just wrote, and
// Inventory reflects the real decremented stock).
//
// Tailwind classes here use arbitrary-value syntax (e.g. bg-[var(--can-primary)])
// pointing at the exact same --can-* tokens (canteen-theme.css) the rest of
// the module uses.

import { useEffect, useMemo, useRef, useState } from "react";
import { formatMoneyDetail } from "@/lib/format";
import type { CanteenChargeReceipt, CanteenProduct, CanteenStudent } from "@/lib/canteen-api";

type Stage = "cart" | "waiting" | "charging" | "success" | "error";

interface CartLine {
  productId: string;
  productName: string;
  unitPricePaise: number;
  availableQuantity: number;
  quantity: number;
}

export function LedgerForm({ products }: { products: CanteenProduct[] }) {
  const sellable = useMemo(() => products.filter((p) => p.quantity > 0), [products]);

  const [stage, setStage] = useState<Stage>("cart");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [pickQuantity, setPickQuantity] = useState(1);
  const [amountOverride, setAmountOverride] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CanteenStudent[]>([]);
  const [searching, setSearching] = useState(false);
  const [receipt, setReceipt] = useState<CanteenChargeReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const computedTotalPaise = cart.reduce((sum, l) => sum + l.unitPricePaise * l.quantity, 0);
  const displayedTotalPaise =
    amountOverride !== null && amountOverride !== "" ? Math.round((parseFloat(amountOverride) || 0) * 100) : computedTotalPaise;
  const canSubmit = cart.length > 0 && displayedTotalPaise > 0;

  useEffect(() => {
    if (!pickerOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [pickerOpen]);

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

  function addToCart() {
    const product = sellable.find((p) => p.id === selectedProductId);
    if (!product || pickQuantity < 1) return;
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + pickQuantity, product.quantity);
        return prev.map((l) => (l.productId === product.id ? { ...l, quantity: nextQty } : l));
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          unitPricePaise: product.pricePerUnitPaise,
          availableQuantity: product.quantity,
          quantity: Math.min(pickQuantity, product.quantity),
        },
      ];
    });
    setSelectedProductId("");
    setPickQuantity(1);
    setPickerOpen(false);
  }

  function updateLineQuantity(productId: string, quantity: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: Math.max(0, Math.min(quantity, l.availableQuantity)) } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

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
      // Fresh per request, never reused across a different student/cart --
      // this exists to make a genuine network-level retry of THIS exact
      // request safe (the backend replays the original result instead of
      // double-charging/double-decrementing stock), not to cover a
      // business-level "try again" after a failure, which may well be for
      // a different student. Same real convention this app already uses
      // for payments/messaging (see finance/payments/actions.ts,
      // faculty/message's ConversationPane.tsx).
      const idempotencyKey = crypto.randomUUID();
      const overridePaise =
        amountOverride !== null && amountOverride !== "" && Math.round((parseFloat(amountOverride) || 0) * 100) !== computedTotalPaise
          ? Math.round((parseFloat(amountOverride) || 0) * 100)
          : undefined;
      const res = await fetch("/api/canteen/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          amountOverridePaise: overridePaise,
          idempotencyKey,
        }),
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
    setStage("cart");
    setCart([]);
    setAmountOverride(null);
    setReceipt(null);
    setError(null);
    setQuery("");
    setResults([]);
  }

  return (
    <div className="mx-auto max-w-[560px] rounded-[16px] border border-[var(--can-border)] bg-[var(--can-white)] p-7" style={{ boxShadow: "var(--can-shadow-card)" }}>
      {stage === "cart" && (
        <>
          <p className="text-[15px] font-bold text-[var(--can-ink)]">New canteen sale</p>
          <p className="mt-1 text-[13px] text-[var(--can-body-muted)]">
            Pick what the student is buying, then tap Move to ledger to identify them and charge their wallet.
          </p>

          <div className="mt-6 flex items-end gap-2.5" ref={pickerRef}>
            <div className="relative flex-1">
              <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--can-body-muted)]">Product</label>
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="mt-2 flex w-full items-center justify-between rounded-[11px] border border-[var(--can-border)] bg-[var(--can-panel)] px-4 py-3 text-left text-[14px] text-[var(--can-ink)]"
              >
                {selectedProductId ? sellable.find((p) => p.id === selectedProductId)?.name : "Choose a product…"}
                <span className="text-[var(--can-tertiary)]">▾</span>
              </button>
              {pickerOpen && (
                <div className="absolute left-0 right-0 z-30 mt-1 max-h-[260px] overflow-y-auto rounded-[11px] border border-[var(--can-border)] bg-[var(--can-white)] shadow-[var(--can-shadow-popover-strong)]">
                  {sellable.length === 0 ? (
                    <div className="px-4 py-3 text-[13px] text-[var(--can-body-muted)]">No products in stock. Add some in Inventory.</div>
                  ) : (
                    sellable.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setPickQuantity(1);
                          setPickerOpen(false);
                        }}
                        className="flex w-full items-center justify-between gap-3 border-b border-[var(--can-border)] px-4 py-2.5 text-left last:border-b-0 hover:bg-[var(--can-tint)]"
                      >
                        <span className="text-[14px] font-semibold text-[var(--can-ink)]">{p.name}</span>
                        <span className="text-[12.5px] text-[var(--can-body-muted)]">
                          {formatMoneyDetail(p.pricePerUnitPaise)} · {p.quantity} left
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div style={{ width: 84 }}>
              <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--can-body-muted)]">Qty</label>
              <input
                type="number"
                min={1}
                value={pickQuantity}
                onChange={(e) => setPickQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="mt-2 w-full rounded-[11px] border border-[var(--can-border)] bg-[var(--can-panel)] px-3 py-3 text-[14px] text-[var(--can-ink)]"
              />
            </div>
            <button
              type="button"
              onClick={addToCart}
              disabled={!selectedProductId}
              className="rounded-[11px] bg-[var(--can-navy)] px-4 py-3 text-[13.5px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add
            </button>
          </div>

          <div className="mt-5 rounded-[11px] border border-[var(--can-border)]">
            {cart.length === 0 ? (
              <div className="px-4 py-6 text-center text-[13px] text-[var(--can-body-muted)]">No items added yet.</div>
            ) : (
              cart.map((l) => (
                <div key={l.productId} className="flex items-center justify-between gap-3 border-b border-[var(--can-border)] px-4 py-3 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[var(--can-ink)]">{l.productName}</p>
                    <p className="text-[12px] text-[var(--can-body-muted)]">{formatMoneyDetail(l.unitPricePaise)} each</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={l.availableQuantity}
                    value={l.quantity}
                    onChange={(e) => updateLineQuantity(l.productId, parseInt(e.target.value, 10) || 0)}
                    className="w-16 rounded-[9px] border border-[var(--can-border)] px-2 py-1.5 text-center text-[13.5px]"
                  />
                  <span className="w-20 flex-shrink-0 text-right text-[13.5px] font-bold text-[var(--can-ink)]">
                    {formatMoneyDetail(l.unitPricePaise * l.quantity)}
                  </span>
                  <button type="button" onClick={() => removeLine(l.productId)} className="flex-shrink-0 text-[var(--can-red-text)]">
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-[12px] px-5 py-4" style={{ background: "var(--can-tint)", border: "1px solid var(--can-tint-2)" }}>
            <span className="text-[13.5px] font-bold text-[var(--can-navy)]">Total to charge</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[18px] font-bold text-[var(--can-primary)]">₹</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={amountOverride ?? (computedTotalPaise / 100).toFixed(2)}
                onChange={(e) => setAmountOverride(e.target.value)}
                className="w-24 bg-transparent text-right text-[22px] font-extrabold outline-none"
                style={{ color: "var(--can-primary)" }}
              />
            </div>
          </div>
          {amountOverride !== null && Math.round((parseFloat(amountOverride) || 0) * 100) !== computedTotalPaise && (
            <p className="mt-1.5 text-right text-[12px] text-[var(--can-tertiary)]">
              Auto total is {formatMoneyDetail(computedTotalPaise)} -- you&rsquo;ve adjusted it.{" "}
              <button type="button" onClick={() => setAmountOverride(null)} className="font-semibold text-[var(--can-primary)]">
                Reset
              </button>
            </p>
          )}

          <button
            type="button"
            onClick={moveToLedger}
            disabled={!canSubmit}
            className="mt-6 w-full rounded-[11px] py-3.5 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: canSubmit ? "var(--can-gradient-accent)" : "var(--can-tertiary)", boxShadow: canSubmit ? "0 4px 14px rgba(29,78,216,.28)" : "none" }}
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
            onClick={() => setStage("cart")}
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
          <p className="text-[13px] text-[var(--can-body-muted)]">Charging the student&rsquo;s wallet and updating stock.</p>
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
            {cart.map((l) => (
              <div key={l.productId} className="flex items-center justify-between py-1 text-[13px] text-[var(--can-body-muted)]">
                <span>{l.productName} × {l.quantity}</span>
                <span className="font-semibold text-[var(--can-ink)]">{formatMoneyDetail(l.unitPricePaise * l.quantity)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-[var(--can-border)] py-1.5 pt-2.5">
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
            className="mt-6 w-full rounded-[11px] py-3.5 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--can-gradient-accent)", boxShadow: "0 4px 14px rgba(29,78,216,.28)" }}
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
            className="mt-6 w-full rounded-[11px] py-3.5 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--can-gradient-accent)", boxShadow: "0 4px 14px rgba(29,78,216,.28)" }}
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
