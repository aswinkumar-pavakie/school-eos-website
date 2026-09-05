import { PrintReportHeader, PrintReportStyles } from "@/components/dashboard/PrintReport";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { formatDate, formatMoneySummary } from "@/lib/format";

interface FeeDemandRow {
  id: string;
  studentFirstName: string;
  studentLastName: string | null;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  feeHeadName: string | null;
  amountPaise: string;
  paidPaise: string;
  pendingPaise: string;
  dueDate: string;
  state: string;
}

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "PAID" || state === "WAIVED") return "success";
  if (state === "OVERDUE") return "critical";
  return "pending";
}

export default async function FeeStatusPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; academicYearId?: string; gradeId?: string; sectionId?: string; state?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  const filterParts: string[] = [];
  for (const key of ["search", "academicYearId", "gradeId", "sectionId", "state"] as const) {
    if (params[key]) {
      query.set(key, params[key]!);
      filterParts.push(`${key}=${params[key]}`);
    }
  }

  const { rows, total, truncated } = await fetchAllPages<FeeDemandRow>("/fee-demands", query);

  return (
    <div className="p-8">
      <PrintReportStyles />
      <PrintReportHeader
        title="Fee Status Report"
        subtitle={`${rows.length}${truncated ? ` of ${total}` : ""} fee instalments — view-only, Admin oversight`}
        filterSummary={filterParts.length > 0 ? filterParts.join(", ") : undefined}
      />
      <table className="report-table w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b-2 border-border text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">
            <th className="py-2 pr-3">Student</th>
            <th className="py-2 pr-3">Class</th>
            <th className="py-2 pr-3">Fee Type</th>
            <th className="py-2 pr-3">Total Fee</th>
            <th className="py-2 pr-3">Paid</th>
            <th className="py-2 pr-3">Pending</th>
            <th className="py-2 pr-3">Due Date</th>
            <th className="py-2 pr-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <td className="py-1.5 pr-3">
                {r.studentFirstName} {r.studentLastName ?? ""}
                <span className="ml-1.5 font-mono text-[10px] text-text-muted">{r.admissionNo}</span>
              </td>
              <td className="py-1.5 pr-3">{r.gradeName ? `${r.gradeName} ${r.sectionName ?? ""}` : "—"}</td>
              <td className="py-1.5 pr-3">{r.feeHeadName ?? "—"}</td>
              <td className="py-1.5 pr-3 font-mono">{formatMoneySummary(r.amountPaise)}</td>
              <td className="py-1.5 pr-3 font-mono">{formatMoneySummary(r.paidPaise)}</td>
              <td className="py-1.5 pr-3 font-mono">{formatMoneySummary(r.pendingPaise)}</td>
              <td className="py-1.5 pr-3">{formatDate(r.dueDate)}</td>
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
