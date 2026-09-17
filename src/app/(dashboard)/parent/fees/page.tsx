// Fees -- pixel-rebuilt from the design's own isFees screen (3-step:
// items -> payment method -> success). Real fee_demand data
// (listFeeTerms/getFeeSummary) and a real, webhook-confirmed Razorpay
// integration (createRazorpayOrder/listPayments) -- see FeesWizard.tsx and
// this route's own actions.ts. "Term" = fee_demand.instalment_no within one
// academic_year; there is no literal term/semester table in this schema.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill, type PillTone } from "@/components/parent-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { formatDate, formatMoneyDetail, formatMoneySummary } from "@/lib/format";
import { getFeeSummary, listChildren, listFeeTerms, listPayments, resolveSelectedChild, type PaymentRow } from "@/lib/parent-api";
import { FeesWizard } from "./FeesWizard";

const PAYMENT_TONE: Record<string, PillTone> = {
  CONFIRMED: "blue",
  INITIATED: "amber",
  FAILED: "red",
};

export default async function ParentFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; academicYearId?: string; instalmentNo?: string }>;
}) {
  try {
    const { studentId: requestedStudentId, academicYearId, instalmentNo } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const terms = await listFeeTerms(selected.studentId);
    const activeTerm =
      terms.find((t) => t.academicYearId === academicYearId && String(t.instalmentNo) === instalmentNo) ?? terms[terms.length - 1];

    const [summary, payments] = await Promise.all([
      activeTerm ? getFeeSummary(selected.studentId, activeTerm.academicYearId, activeTerm.instalmentNo) : null,
      listPayments(selected.studentId),
    ]);

    return (
      <div className="parent-scope">
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6, color: "var(--par-ink)" }}>Fees</div>
          <div style={{ fontSize: 15, color: "var(--par-body-muted)" }}>{selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join("-")}</div>
        </div>

        {terms.length === 0 || !activeTerm || !summary ? (
          <EmptyPanel label="No fee terms set up for this child yet." />
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {terms.map((t) => {
                const active = t.academicYearId === activeTerm.academicYearId && t.instalmentNo === activeTerm.instalmentNo;
                return (
                  <a key={`${t.academicYearId}-${t.instalmentNo}`} href={`/parent/fees?studentId=${selected.studentId}&academicYearId=${t.academicYearId}&instalmentNo=${t.instalmentNo}`} style={{ textDecoration: "none" }}>
                    <span style={{ display: "inline-block", borderRadius: 9, padding: "9px 16px", fontSize: 13.5, fontWeight: 700, background: active ? "var(--par-navy)" : "#fff", color: active ? "#fff" : "var(--par-ink)", border: active ? undefined : "1px solid var(--par-border)" }}>
                      {t.label}
                    </span>
                  </a>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 16, marginBottom: 20 }}>
              <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>Total payable</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--par-ink)" }}>{formatMoneyDetail(summary.totalPayablePaise)}</div>
              </div>
              <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>Paid</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--par-ink)" }}>{formatMoneyDetail(summary.paidPaise)}</div>
              </div>
              <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>Outstanding</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: Number(summary.outstandingPaise) > 0 ? "var(--par-red)" : "var(--par-ink)" }}>{formatMoneyDetail(summary.outstandingPaise)}</div>
              </div>
            </div>

            {summary.canPay ? (
              <FeesWizard studentId={selected.studentId} academicYearId={activeTerm.academicYearId} instalmentNo={activeTerm.instalmentNo} lines={summary.lines} />
            ) : (
              <EmptyPanel label="Online payment isn't open for this term yet." />
            )}

            <div style={{ fontSize: 16, fontWeight: 700, margin: "28px 0 14px", color: "var(--par-ink)" }}>Payment history</div>
            {payments.length === 0 ? (
              <EmptyPanel label="No payments yet." />
            ) : (
              <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, overflow: "hidden" }}>
                {payments.map((p) => (
                  <PaymentRowView key={p.id} payment={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load fees."} />;
  }
}

function PaymentRowView({ payment }: { payment: PaymentRow }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid var(--par-divider)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--par-ink)" }}>{formatMoneyDetail(payment.amountPaise)}</div>
        <div style={{ fontSize: 12.5, color: "var(--par-body-muted)" }}>
          {formatDate(payment.confirmedAt ?? payment.initiatedAt)} · {payment.mode}
          {payment.receiptNo ? ` · Receipt ${payment.receiptNo}` : ""}
        </div>
      </div>
      <StatusPill label={payment.state} tone={PAYMENT_TONE[payment.state] ?? "gray"} />
    </div>
  );
}
