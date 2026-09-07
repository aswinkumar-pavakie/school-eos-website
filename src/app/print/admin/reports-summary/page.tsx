import { PrintReportHeader, PrintReportStyles } from "@/components/dashboard/PrintReport";
import { getReportsSummary } from "@/lib/reports-api";

interface SummaryRow {
  section: string;
  metric: string;
  label: string;
  value: string | number;
}

export default async function AdminReportsSummaryPrintPage() {
  const summary = await getReportsSummary();
  const rows: SummaryRow[] = [];

  for (const r of summary.enrollment.byGrade) rows.push({ section: "Enrollment", metric: "By grade", label: r.gradeName, value: r.count });
  for (const r of summary.enrollment.byGender) rows.push({ section: "Enrollment", metric: "By gender", label: r.gender, value: r.count });
  rows.push({ section: "Enrollment", metric: "Active / inactive", label: "Active", value: summary.enrollment.activeCount });
  rows.push({ section: "Enrollment", metric: "Active / inactive", label: "Inactive", value: summary.enrollment.inactiveCount });

  for (const r of summary.staff.byDesignation) rows.push({ section: "Staff", metric: "By designation", label: r.designation, value: r.count });
  rows.push({ section: "Staff", metric: "Teaching / non-teaching", label: "Teaching", value: summary.staff.teachingCount });
  rows.push({ section: "Staff", metric: "Teaching / non-teaching", label: "Non-teaching", value: summary.staff.nonTeachingCount });

  for (const r of summary.attendance.dailyPercentPresent) rows.push({ section: "Attendance", metric: "Daily % present", label: r.date, value: r.percentPresent });

  for (const r of summary.fees.byState) rows.push({ section: "Fees", metric: "By state", label: r.state, value: r.count });
  rows.push({ section: "Fees", metric: "Outstanding", label: "Total outstanding (paise)", value: summary.fees.totalOutstandingPaise });

  for (const r of summary.transport.ridershipByRoute) rows.push({ section: "Transport", metric: "Ridership by route", label: r.routeName, value: r.count });
  for (const r of summary.transport.vehiclesByStatus) rows.push({ section: "Transport", metric: "Vehicles by status", label: r.status, value: r.count });

  for (const r of summary.hostel.occupancyByHostel) {
    rows.push({ section: "Hostel", metric: "Occupancy", label: `${r.hostelName} — occupied`, value: r.occupied });
    rows.push({ section: "Hostel", metric: "Occupancy", label: `${r.hostelName} — vacant`, value: r.vacant });
  }

  for (const r of summary.inventory.byStatus) rows.push({ section: "Inventory", metric: "By status", label: r.status, value: r.count });

  for (const r of summary.library.byStatus) rows.push({ section: "Library", metric: "By status", label: r.status, value: r.count });
  rows.push({ section: "Library", metric: "Outstanding fines", label: "Total outstanding fines (paise)", value: summary.library.outstandingFinesPaise });

  for (const r of summary.requestsApprovals.byState) rows.push({ section: "Requests & Approvals", metric: "By state", label: r.state, value: r.count });
  for (const r of summary.requestsApprovals.byType) rows.push({ section: "Requests & Approvals", metric: "By type", label: r.requestType, value: r.count });

  return (
    <div className="p-8">
      <PrintReportStyles />
      <PrintReportHeader title="Reports & Analytics" subtitle={`${rows.length} rows across 9 sections`} />
      <table className="report-table w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b-2 border-border text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">
            <th className="py-2 pr-3">Section</th>
            <th className="py-2 pr-3">Metric</th>
            <th className="py-2 pr-3">Label</th>
            <th className="py-2 pr-3">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border">
              <td className="py-2 pr-3">{r.section}</td>
              <td className="py-2 pr-3">{r.metric}</td>
              <td className="py-2 pr-3">{r.label}</td>
              <td className="py-2 pr-3">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
