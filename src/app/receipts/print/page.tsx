import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import { formatDate, formatMoneyDetail } from "@/lib/format";
import { getReceiptDetail, type ReceiptDetail } from "@/lib/finance-api";
import { PrintButton } from "./PrintButton";

const MODE_LABELS: Record<string, string> = {
  UPI: "UPI",
  CARD: "Card",
  NETBANKING: "Net Banking",
  CASH: "Cash",
  CHEQUE: "Cheque",
  DD: "Demand Draft",
  WALLET_TOPUP: "Wallet Top-up",
};

function ReceiptDocument({ detail }: { detail: ReceiptDetail }) {
  const { receipt, payment, student, lineItems, school } = detail;
  const isDD = payment.mode === "DD";

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
        <h2 className="mt-2 text-sm font-bold tracking-[0.15em] uppercase text-text">Fee Payment Receipt</h2>
      </header>

      <div className="grid grid-cols-2 gap-6 text-sm">
        <dl className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">Name of Student</dt>
            <dd className="font-bold text-text">{student?.displayName ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">Admission No.</dt>
            <dd className="font-bold text-text">{student?.admissionNo ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">Grade / Section</dt>
            <dd className="text-text">{[student?.gradeName, student?.sectionName].filter(Boolean).join(" / ") || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">Date of Payment</dt>
            <dd className="text-text">{formatDate(payment.confirmedAt ?? payment.initiatedAt)}</dd>
          </div>
        </dl>
        <dl className="flex flex-col gap-1.5 text-right">
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">Receipt No.</dt>
            <dd className="font-mono font-bold text-[#1B3F9E]">{receipt.receiptNo}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">Financial Year</dt>
            <dd className="text-text">{receipt.financialYear}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-text-muted">Mode of Payment</dt>
            <dd className="text-text">{MODE_LABELS[payment.mode] ?? payment.mode}</dd>
          </div>
          {isDD && (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Bank</dt>
                <dd className="text-text">{payment.gateway ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">DD Reference No.</dt>
                <dd className="font-mono text-text">{payment.gatewayRef ?? "—"}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-[#1B3F9E]">
            <th className="py-2 pr-2 text-left font-bold text-[#1B3F9E]">#</th>
            <th className="py-2 pr-2 text-left font-bold text-[#1B3F9E]">Particulars</th>
            <th className="py-2 pl-2 text-right font-bold text-[#1B3F9E]">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.length === 0 ? (
            <tr className="border-b border-border">
              <td className="py-2 pr-2 text-text-muted">1</td>
              <td className="py-2 pr-2 text-text-muted">Fee payment</td>
              <td className="py-2 pl-2 text-right font-mono text-text">{formatMoneyDetail(receipt.amountPaise)}</td>
            </tr>
          ) : (
            lineItems.map((item, i) => (
              <tr key={`${item.feeHeadId}-${item.instalmentNo}`} className="border-b border-border">
                <td className="py-2 pr-2 text-text-muted">{i + 1}</td>
                <td className="py-2 pr-2 text-text">{item.feeHeadName ?? "Fee"} — Instalment {item.instalmentNo}</td>
                <td className="py-2 pl-2 text-right font-mono text-text">{formatMoneyDetail(item.amountPaise)}</td>
              </tr>
            ))
          )}
          <tr className="bg-field font-bold">
            <td className="py-2 pr-2" colSpan={2}>Total</td>
            <td className="py-2 pl-2 text-right font-mono text-[#1B3F9E]">{formatMoneyDetail(receipt.amountPaise)}</td>
          </tr>
        </tbody>
      </table>

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
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const receiptIds = (ids ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  if (receiptIds.length === 0) {
    return <p className="p-10 text-sm text-text-muted">No receipts selected.</p>;
  }

  try {
    const details = await Promise.all(receiptIds.map((id) => getReceiptDetail(id)));

    return (
      <div className="min-h-screen bg-[#e8e8ec] py-8 print:bg-white print:py-0">
        <style>{`
          @media print {
            @page { margin: 12mm; }
            .receipt-page { break-after: page; }
            .receipt-page:last-child { break-after: auto; }
          }
        `}</style>
        <div className="no-print sticky top-0 z-10 mb-6 flex justify-center">
          <PrintButton />
        </div>
        <div className="flex flex-col items-center gap-8">
          {details.map((detail) => (
            <ReceiptDocument key={detail.receipt.id} detail={detail} />
          ))}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <p className="p-10 text-sm text-critical-text">Couldn&apos;t load one or more receipts. Nothing was submitted — try again.</p>;
  }
}
