import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import { formatDate, formatMoneyDetail } from "@/lib/format";
import { getReceiptDetail, type ReceiptDetail } from "@/lib/finance-api";
import { PrintButton } from "./PrintButton";
import { AutoPrint } from "./AutoPrint";

const MODE_LABELS: Record<string, string> = {
  UPI: "UPI",
  CARD: "Card",
  NETBANKING: "Net Banking",
  CASH: "Cash",
  CHEQUE: "Cheque",
  DD: "Demand Draft",
  WALLET_TOPUP: "Wallet Top-up",
};

/**
 * One physical receipt document — however many payments were selected, this is the
 * ONE piece of paper that gets printed. Selecting several payments in Payment History
 * used to print several full separate receipt pages back to back; that's the bug the
 * user reported ("bill printed multiple times"). Now every selected payment becomes
 * one grouped section of a single combined receipt, with one grand total and one
 * signature block.
 */
function CombinedReceiptDocument({ details, includeEducationLoan }: { details: ReceiptDetail[]; includeEducationLoan: boolean }) {
  const school = details.find((d) => d.school)?.school ?? null;
  const multiple = details.length > 1;

  // In every real flow these selections come from one student's own Payment History,
  // so this is normally a single student — but defend against a mixed set anyway
  // rather than silently showing the wrong name.
  const studentIds = new Set(details.map((d) => d.student?.id).filter(Boolean));
  const singleStudent = studentIds.size === 1 ? details.find((d) => d.student)?.student ?? null : null;
  const showStudentColumn = studentIds.size > 1;

  const grandTotalPaise = details.reduce((sum, d) => sum + BigInt(d.receipt.amountPaise), BigInt(0)).toString();

  // A DD reference number only ever means something for a payment genuinely recorded
  // as mode 'DD' — online gateways (UPI/CARD/NETBANKING) populate the same gatewayRef
  // column with their own transaction reference, so it must never be relabelled "DD
  // Reference No." for those. The section always shows for a real DD payment (the
  // reference is mandatory documentation, not optional); the "Education Loan" toggle
  // additionally guarantees it's shown (and says so plainly when there's genuinely
  // nothing to show) for a batch print where the DD payment might otherwise be easy
  // to miss among several receipts.
  const ddDetails = details.filter((d) => d.payment.mode === "DD");
  const showEducationLoanSection = includeEducationLoan || ddDetails.length > 0;

  return (
    <section className="receipt-page mx-auto flex w-[210mm] min-h-[148mm] flex-col gap-6 border border-border bg-white p-10 text-[#1a1a2e] print:border-0">
      <header className="flex flex-col items-center gap-1 border-b-2 border-[#1B3F9E] pb-4 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#1B3F9E]">{school?.name ?? "School EOS"}</h1>
        {(school?.addressLine1 || school?.city) && (
          <p className="text-xs text-text-muted">
            {[school?.addressLine1, school?.addressLine2, school?.city, school?.district, school?.state, school?.pincode]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
        <p className="text-xs text-text-muted">
          {[school?.board, school?.recognitionNo ? `Recognition No: ${school.recognitionNo}` : null].filter(Boolean).join(" · ")}
        </p>
        {(school?.contactPhone || school?.contactEmail) && (
          <p className="text-xs text-text-muted">
            {[school?.contactPhone ? `Phone: ${school.contactPhone}` : null, school?.contactEmail].filter(Boolean).join(" · ")}
          </p>
        )}
        <h2 className="mt-2 text-sm font-bold tracking-[0.15em] uppercase text-text">
          Fee Payment Receipt{multiple ? ` — ${details.length} Payments` : ""}
        </h2>
      </header>

      <div className="grid grid-cols-2 gap-6 text-sm">
        <dl className="flex flex-col gap-1.5">
          {singleStudent && (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Name of Student</dt>
                <dd className="font-bold text-text">{singleStudent.displayName ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Admission No.</dt>
                <dd className="font-bold text-text">{singleStudent.admissionNo ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Grade / Section</dt>
                <dd className="text-text">{[singleStudent.gradeName, singleStudent.sectionName].filter(Boolean).join(" / ") || "—"}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">{multiple ? "Date Range" : "Date of Payment"}</dt>
            <dd className="text-text">
              {multiple
                ? `${formatDate(details[details.length - 1].payment.confirmedAt ?? details[details.length - 1].payment.initiatedAt)} – ${formatDate(details[0].payment.confirmedAt ?? details[0].payment.initiatedAt)}`
                : formatDate(details[0].payment.confirmedAt ?? details[0].payment.initiatedAt)}
            </dd>
          </div>
        </dl>
        <dl className="flex flex-col gap-1.5 text-right">
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">{multiple ? "Receipt Nos." : "Receipt No."}</dt>
            <dd className="font-mono font-bold text-[#1B3F9E]">{details.map((d) => d.receipt.receiptNo).join(", ")}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">Financial Year</dt>
            <dd className="text-text">{details[0].receipt.financialYear}</dd>
          </div>
          {!multiple && (
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Mode of Payment</dt>
              <dd className="text-text">{MODE_LABELS[details[0].payment.mode] ?? details[0].payment.mode}</dd>
            </div>
          )}
        </dl>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-[#1B3F9E]">
            <th className="py-2 pr-2 text-left font-bold text-[#1B3F9E]">#</th>
            {multiple && <th className="py-2 pr-2 text-left font-bold text-[#1B3F9E]">Receipt / Date</th>}
            {showStudentColumn && <th className="py-2 pr-2 text-left font-bold text-[#1B3F9E]">Student</th>}
            <th className="py-2 pr-2 text-left font-bold text-[#1B3F9E]">Particulars</th>
            <th className="py-2 pl-2 text-right font-bold text-[#1B3F9E]">Amount</th>
          </tr>
        </thead>
        <tbody>
          {details.map((detail, di) => {
            const items = detail.lineItems.length > 0
              ? detail.lineItems
              : [{ feeHeadId: null, feeHeadName: "Fee payment", instalmentNo: 0, amountPaise: detail.receipt.amountPaise }];
            return items.map((item, i) => (
              <tr key={`${detail.receipt.id}-${item.feeHeadId ?? "flat"}-${item.instalmentNo}`} className="border-b border-border">
                <td className="py-2 pr-2 align-top text-text-muted">{i === 0 ? di + 1 : ""}</td>
                {multiple && (
                  <td className="py-2 pr-2 align-top text-text-muted">
                    {i === 0 ? <><span className="font-mono">{detail.receipt.receiptNo}</span><br />{formatDate(detail.payment.confirmedAt ?? detail.payment.initiatedAt)}</> : ""}
                  </td>
                )}
                {showStudentColumn && <td className="py-2 pr-2 align-top text-text">{i === 0 ? (detail.student?.displayName ?? "—") : ""}</td>}
                <td className="py-2 pr-2 text-text">
                  {item.feeHeadName ?? "Fee"}
                  {item.instalmentNo > 0 ? ` — Instalment ${item.instalmentNo}` : ""}
                </td>
                <td className="py-2 pl-2 text-right font-mono text-text">{formatMoneyDetail(item.amountPaise)}</td>
              </tr>
            ));
          })}
          <tr className="bg-field font-bold">
            <td className="py-2 pr-2" colSpan={1 + (multiple ? 1 : 0) + (showStudentColumn ? 1 : 0) + 1}>Grand Total</td>
            <td className="py-2 pl-2 text-right font-mono text-[#1B3F9E]">{formatMoneyDetail(grandTotalPaise)}</td>
          </tr>
        </tbody>
      </table>

      {showEducationLoanSection && (
        <section className="rounded-[var(--radius-card)] border border-[#1B3F9E]/30 bg-[#1B3F9E]/5 p-4 text-sm">
          <h3 className="mb-2 text-xs font-bold tracking-wide text-[#1B3F9E] uppercase">Education Loan — Demand Draft Details</h3>
          {ddDetails.length === 0 ? (
            <p className="text-xs text-text-muted">No education loan (DD) payment found among the selected receipts.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#1B3F9E]/30 text-xs text-text-muted">
                  <th className="py-1 pr-2 text-left font-bold">Receipt No.</th>
                  <th className="py-1 pr-2 text-left font-bold">Bank</th>
                  <th className="py-1 pr-2 text-left font-bold">DD Reference No.</th>
                  <th className="py-1 pl-2 text-right font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {ddDetails.map((d) => (
                  <tr key={d.receipt.id} className="border-b border-[#1B3F9E]/10 last:border-0">
                    <td className="py-1 pr-2 font-mono text-text">{d.receipt.receiptNo}</td>
                    <td className="py-1 pr-2 text-text">{d.payment.gateway ?? "—"}</td>
                    <td className="py-1 pr-2 font-mono text-text">{d.payment.gatewayRef ?? "—"}</td>
                    <td className="py-1 pl-2 text-right font-mono text-text">{formatMoneyDetail(d.receipt.amountPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      <div className="mt-auto grid grid-cols-2 gap-6 pt-10 text-sm">
        <div className="flex flex-col items-center gap-1">
          <div className="w-full border-t border-text-muted" />
          <p className="text-text-muted">Authorized Signatory</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-full border-t border-text-muted" />
          <p className="text-text-muted">Parent / Guardian Signature</p>
        </div>
      </div>

      <p className="text-center text-[10px] text-text-muted">This is a computer-generated receipt issued by {school?.name ?? "School EOS"}.</p>
    </section>
  );
}

export default async function ReceiptPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; edu?: string }>;
}) {
  const { ids, edu } = await searchParams;
  const receiptIds = (ids ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const includeEducationLoan = edu === "1";

  if (receiptIds.length === 0) {
    return <p className="p-10 text-sm text-text-muted">No receipts selected.</p>;
  }

  try {
    const details = await Promise.all(receiptIds.map((id) => getReceiptDetail(id)));
    // Keep the printed order matching selection order (oldest-selected first reads
    // naturally top to bottom), same as they were checked in Payment History.
    details.sort((a, b) => a.payment.initiatedAt.localeCompare(b.payment.initiatedAt));

    return (
      <div className="min-h-screen bg-[#e8e8ec] py-8 print:bg-white print:py-0">
        <style>{`
          @media print {
            @page { size: A4; margin: 12mm; }
            html, body { background: #fff; }
            .receipt-page { width: auto; min-height: 0; border: none; }
          }
        `}</style>
        <AutoPrint />
        <div className="no-print sticky top-0 z-10 mb-6 flex justify-center">
          <PrintButton />
        </div>
        <div className="flex flex-col items-center gap-8">
          <CombinedReceiptDocument details={details} includeEducationLoan={includeEducationLoan} />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <p className="p-10 text-sm text-critical-text">Couldn&apos;t load one or more receipts. Nothing was submitted — try again.</p>;
  }
}
