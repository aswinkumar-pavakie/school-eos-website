import { PrintReportHeader, PrintReportStyles } from "@/components/dashboard/PrintReport";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { formatDate, formatMoneySummary } from "@/lib/format";

interface PaymentRow {
  id: string;
  studentFirstName: string | null;
  studentLastName: string | null;
  admissionNo: string | null;
  amountPaise: string;
  mode: string;
  state: string;
  confirmedAt: string | null;
  initiatedAt: string;
  receiptNo: string | null;
  collectedByName: string | null;
}

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "CONFIRMED" || state === "RECONCILED") return "success";
  if (state === "FAILED" || state === "REVERSED") return "critical";
  return "pending";
}

export default async function PaymentsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; state?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  const filterParts: string[] = [];
  for (const key of ["search", "state", "mode"] as const) {
    if (params[key]) {
      query.set(key, params[key]!);
      filterParts.push(`${key}=${params[key]}`);
    }
  }

  const { rows, total, truncated } = await fetchAllPages<PaymentRow>("/payments", query);

  return (
    <div className="p-8">
      <PrintReportStyles />
      <PrintReportHeader
        title="Payments Report"
        subtitle={`${rows.length}${truncated ? ` of ${total}` : ""} payments — view-only, Admin oversight`}
        filterSummary={filterParts.length > 0 ? filterParts.join(", ") : undefined}
      />
      <table className="report-table w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b-2 border-border text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">
            <th className="py-2 pr-3">Student</th>
            <th className="py-2 pr-3">Amount</th>
            <th className="py-2 pr-3">Mode</th>
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Receipt No.</th>
            <th className="py-2 pr-3">Collected By</th>
            <th className="py-2 pr-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <td className="py-1.5 pr-3">
                {r.studentFirstName ? `${r.studentFirstName} ${r.studentLastName ?? ""}` : "—"}
                {r.admissionNo && <span className="ml-1.5 font-mono text-[10px] text-text-muted">{r.admissionNo}</span>}
              </td>
              <td className="py-1.5 pr-3 font-mono">{formatMoneySummary(r.amountPaise)}</td>
              <td className="py-1.5 pr-3">{r.mode}</td>
              <td className="py-1.5 pr-3">{formatDate(r.confirmedAt ?? r.initiatedAt)}</td>
              <td className="py-1.5 pr-3">{r.receiptNo ?? "—"}</td>
              <td className="py-1.5 pr-3">{r.collectedByName ?? "—"}</td>
              <td className="py-1.5 pr-3">
                <StatusPill tone={stateTone(r.state)} label={r.state} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
