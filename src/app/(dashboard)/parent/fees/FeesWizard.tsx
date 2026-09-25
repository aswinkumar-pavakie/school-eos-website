"use client";

import { useEffect, useRef, useState } from "react";
import { PrimaryButton, SecondaryButton, StatusPill } from "@/components/parent-ui/primitives";
import { formatMoneyDetail, formatMoneySummary, formatDate } from "@/lib/format";
import { nowMs } from "@/lib/parent-time";
import type { FeeLine } from "@/lib/parent-api";
import { createFeeOrderAction, getPaymentStatusAction } from "./actions";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Could not load the payment gateway.")));
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment gateway."));
    document.body.appendChild(script);
  });
}

type Step = "items" | "method" | "processing" | "success" | "failed";

export function FeesWizard({
  studentId,
  academicYearId,
  instalmentNo,
  lines,
}: {
  studentId: string;
  academicYearId: string;
  instalmentNo: number;
  lines: FeeLine[];
}) {
  const payable = lines.filter((l) => l.state === "PENDING" || l.state === "PARTIAL" || l.state === "OVERDUE");
  const [selected, setSelected] = useState<Set<string>>(new Set(payable.map((l) => l.feeDemandId)));
  const [step, setStep] = useState<Step>("items");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const [receiptNo, setReceiptNo] = useState<string | undefined>();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const selectedLines = payable.filter((l) => selected.has(l.feeDemandId));
  const totalPaise = selectedLines.reduce((sum, l) => sum + BigInt(l.outstandingPaise), BigInt(0));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function startPayment() {
    setError(undefined);
    setPending(true);
    try {
      await loadRazorpayScript();
      const order = await createFeeOrderAction(studentId, {
        academicYearId,
        instalmentNo,
        feeDemandIds: [...selected],
        amountPaise: totalPaise.toString(),
      });

      const razorpay = new window.Razorpay!({
        key: order.razorpayKeyId,
        amount: Number(order.amountPaise),
        currency: "INR",
        name: order.schoolName,
        description: "School fee payment",
        order_id: order.razorpayOrderId,
        handler: () => pollForConfirmation(order.paymentId),
        modal: { ondismiss: () => pollForConfirmation(order.paymentId) },
        theme: { color: "#1f6feb" },
      });
      setStep("processing");
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the payment.");
    } finally {
      setPending(false);
    }
  }

  function pollForConfirmation(paymentId: string) {
    const startedAt = nowMs();
    pollRef.current = setInterval(async () => {
      const row = await getPaymentStatusAction(studentId, paymentId).catch(() => null);
      if (row?.state === "CONFIRMED") {
        if (pollRef.current) clearInterval(pollRef.current);
        setReceiptNo(row.receiptNo ?? undefined);
        setStep("success");
        return;
      }
      if (row?.state === "FAILED") {
        if (pollRef.current) clearInterval(pollRef.current);
        setError(row.failureReason ?? "Payment failed.");
        setStep("failed");
        return;
      }
      if (nowMs() - startedAt > 90_000) {
        if (pollRef.current) clearInterval(pollRef.current);
        setError("Still waiting for confirmation — check My Payments in a few minutes.");
        setStep("failed");
      }
    }, 2500);
  }

  if (payable.length === 0) {
    return <div style={{ padding: "44px 20px", textAlign: "center", fontSize: 14, color: "var(--par-tertiary)", background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16 }}>Nothing due for this term.</div>;
  }

  if (step === "items") {
    return (
      <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, overflow: "hidden" }}>
        {payable.map((l) => (
          <label key={l.feeDemandId} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid var(--par-divider)", cursor: "pointer" }}>
            <input type="checkbox" checked={selected.has(l.feeDemandId)} onChange={() => toggle(l.feeDemandId)} style={{ width: 18, height: 18, accentColor: "var(--par-primary)" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--par-ink)" }}>{l.feeHeadName}</div>
              <div style={{ fontSize: 12.5, color: "var(--par-body-muted)" }}>Due {formatDate(l.dueDate)}{Number(l.lateFeePaise) > 0 ? ` · Late fee ${formatMoneySummary(l.lateFeePaise)}` : ""}</div>
            </div>
            <StatusPill label={l.state} tone={l.state === "OVERDUE" ? "red" : "amber"} />
            <div style={{ width: 100, textAlign: "right", fontSize: 15, fontWeight: 800, color: "var(--par-ink)" }}>{formatMoneyDetail(l.outstandingPaise)}</div>
          </label>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--par-tertiary)" }}>Selected total</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--par-ink)" }}>{formatMoneyDetail(totalPaise.toString())}</div>
          </div>
          <PrimaryButton type="button" disabled={selected.size === 0} onClick={() => setStep("method")}>Continue</PrimaryButton>
        </div>
      </div>
    );
  }

  if (step === "method") {
    return (
      <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--par-ink)", marginBottom: 4 }}>Payment method</div>
        <div style={{ fontSize: 13.5, color: "var(--par-body-muted)", marginBottom: 18 }}>Pay securely via Razorpay — cards, UPI and net banking are all supported in the next step.</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderRadius: 12, background: "var(--par-panel-2)", marginBottom: 18 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--par-ink)" }}>Amount payable</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: "var(--par-primary-strong)" }}>{formatMoneyDetail(totalPaise.toString())}</span>
        </div>
        {error && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 9, background: "var(--par-red-bg)", color: "var(--par-red)", fontSize: 13, fontWeight: 600 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <SecondaryButton type="button" onClick={() => setStep("items")} disabled={pending}>Back</SecondaryButton>
          <PrimaryButton type="button" onClick={startPayment} disabled={pending}>{pending ? "Opening…" : `Pay ${formatMoneySummary(totalPaise.toString())}`}</PrimaryButton>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--par-ink)", marginBottom: 6 }}>Confirming your payment…</div>
        <div style={{ fontSize: 13.5, color: "var(--par-body-muted)" }}>This can take a few seconds after the bank confirms the transfer.</div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 40, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--par-tint)", color: "var(--par-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 26 }}>✓</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--par-ink)", marginBottom: 6 }}>Payment successful</div>
        <div style={{ fontSize: 13.5, color: "var(--par-body-muted)", marginBottom: 18 }}>{receiptNo ? `Receipt ${receiptNo}` : "Your receipt will appear in Payments shortly."}</div>
        <a href="/parent/fees" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--par-primary)" }}>Back to Fees</a>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--par-red)", marginBottom: 6 }}>Payment not confirmed</div>
      <div style={{ fontSize: 13.5, color: "var(--par-body-muted)", marginBottom: 18 }}>{error}</div>
      <SecondaryButton type="button" onClick={() => setStep("items")}>Try again</SecondaryButton>
    </div>
  );
}
