import { PrintReportHeader, PrintReportStyles } from "@/components/dashboard/PrintReport";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";

interface StaffDailyStatus {
  staffId: string;
  employeeNo: string;
  firstName: string;
  lastName: string | null;
  designation: string | null;
  status: string | null;
  markedAt: string | null;
  reason: string | null;
}

function statusInfo(status: string | null): { label: string; tone: "success" | "pending" | "critical" } {
  if (status === "CHECK_IN") return { label: "Present", tone: "success" };
  if (status === "ABSENT") return { label: "Absent", tone: "critical" };
  return { label: "Not marked", tone: "pending" };
}

export default async function StaffAttendanceRegisterPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; isTeaching?: string; gradeId?: string; sectionId?: string; subjectId?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  const filterParts: string[] = [];
  for (const key of ["date", "isTeaching", "gradeId", "sectionId", "subjectId"] as const) {
    if (params[key]) {
      query.set(key, params[key]!);
      filterParts.push(`${key}=${params[key]}`);
    }
  }

  const res = await apiFetch(`/staff-attendance?${query.toString()}`);
  const roster: StaffDailyStatus[] = res.ok ? ((await res.json()) as { data: StaffDailyStatus[] }).data : [];

  return (
    <div className="p-8">
      <PrintReportStyles />
      <PrintReportHeader
        title="Staff Attendance Register"
        subtitle={`${roster.length} staff · ${params.date ?? "today"}`}
        filterSummary={filterParts.length > 0 ? filterParts.join(", ") : undefined}
      />
      <table className="report-table w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b-2 border-border text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">
            <th className="py-2 pr-3">Employee No</th>
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Designation</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Marked At</th>
            <th className="py-2 pr-3">Reason</th>
          </tr>
        </thead>
        <tbody>
          {roster.map((r) => {
            const info = statusInfo(r.status);
            return (
              <tr key={r.staffId} className="border-b border-border">
                <td className="py-2 pr-3 font-mono">{r.employeeNo}</td>
                <td className="py-2 pr-3">{r.firstName} {r.lastName ?? ""}</td>
                <td className="py-2 pr-3">{r.designation ?? "—"}</td>
                <td className="py-2 pr-3"><StatusPill tone={info.tone} label={info.label} /></td>
                <td className="py-2 pr-3">{r.markedAt ?? "—"}</td>
                <td className="py-2 pr-3">{r.reason ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
