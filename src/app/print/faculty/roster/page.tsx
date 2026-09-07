import { PrintReportHeader, PrintReportStyles } from "@/components/dashboard/PrintReport";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { formatDate } from "@/lib/format";

interface StaffRow {
  id: string;
  firstName: string;
  lastName: string | null;
  employeeNo: string;
  designation: string | null;
  isTeaching: boolean;
  dateOfJoining: string;
  status: string;
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "EXITED") return "critical";
  return "pending";
}

export default async function FacultyRosterPrintPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    isTeaching?: string;
    designation?: string;
    gradeId?: string;
    sectionId?: string;
    subjectId?: string;
  }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  const filterParts: string[] = [];
  for (const key of ["search", "status", "isTeaching", "designation", "gradeId", "sectionId", "subjectId"] as const) {
    if (params[key]) {
      query.set(key, params[key]!);
      filterParts.push(`${key}=${params[key]}`);
    }
  }

  const { rows, total, truncated } = await fetchAllPages<StaffRow>("/staff", query);

  return (
    <div className="p-8">
      <PrintReportStyles />
      <PrintReportHeader
        title="Faculty & Staff Report"
        subtitle={`${rows.length}${truncated ? ` of ${total}` : ""} staff records`}
        filterSummary={filterParts.length > 0 ? filterParts.join(", ") : undefined}
      />
      <table className="report-table w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b-2 border-border text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Employee No</th>
            <th className="py-2 pr-3">Designation</th>
            <th className="py-2 pr-3">Teaching</th>
            <th className="py-2 pr-3">Joined</th>
            <th className="py-2 pr-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <td className="py-2 pr-3">{r.firstName} {r.lastName ?? ""}</td>
              <td className="py-2 pr-3 font-mono">{r.employeeNo}</td>
              <td className="py-2 pr-3">{r.designation ?? "—"}</td>
              <td className="py-2 pr-3">{r.isTeaching ? "Yes" : "No"}</td>
              <td className="py-2 pr-3">{formatDate(r.dateOfJoining)}</td>
              <td className="py-2 pr-3"><StatusPill tone={statusTone(r.status)} label={r.status.replace(/_/g, " ")} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
