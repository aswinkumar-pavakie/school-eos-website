import { PrintReportHeader, PrintReportStyles } from "@/components/dashboard/PrintReport";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { formatDate } from "@/lib/format";

interface StudentRow {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
  admissionDate: string;
  status: string;
  isHosteller: boolean;
  gradeName: string | null;
  sectionName: string | null;
  rollNo: number | null;
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "TC_ISSUED" || status === "ARCHIVED") return "critical";
  return "pending";
}

export default async function StudentsRosterPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; gradeId?: string; sectionId?: string; sectionName?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  const filterParts: string[] = [];
  for (const key of ["search", "status", "gradeId", "sectionId", "sectionName"] as const) {
    if (params[key]) {
      query.set(key, params[key]!);
      filterParts.push(`${key}=${params[key]}`);
    }
  }

  const { rows, total, truncated } = await fetchAllPages<StudentRow>("/students", query);

  return (
    <div className="p-8">
      <PrintReportStyles />
      <PrintReportHeader
        title="Students Report"
        subtitle={`${rows.length}${truncated ? ` of ${total}` : ""} students`}
        filterSummary={filterParts.length > 0 ? filterParts.join(", ") : undefined}
      />
      <table className="report-table w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b-2 border-border text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Admission No</th>
            <th className="py-2 pr-3">Class</th>
            <th className="py-2 pr-3">Admitted</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Hosteller</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <td className="py-2 pr-3">{r.firstName} {r.lastName ?? ""}</td>
              <td className="py-2 pr-3 font-mono">{r.admissionNo}</td>
              <td className="py-2 pr-3">{r.gradeName ? `${r.gradeName} ${r.sectionName ?? ""}` : "Unassigned"}</td>
              <td className="py-2 pr-3">{formatDate(r.admissionDate)}</td>
              <td className="py-2 pr-3"><StatusPill tone={statusTone(r.status)} label={r.status.replace(/_/g, " ")} /></td>
              <td className="py-2 pr-3">{r.isHosteller ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
