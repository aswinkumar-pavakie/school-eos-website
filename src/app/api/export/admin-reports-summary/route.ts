// Export for the Reports & Analytics page -- admin.md's own documented Reports
// functions list ends with "Export"; every other Admin export route follows this
// same plain-CSV pattern (no new dependency). Reuses GET /admin/reports-summary
// verbatim (the exact same call the Reports page itself makes) -- no new backend
// endpoint, no re-aggregation, no second source of truth. Every section's
// breakdown is flattened into one row per (section, metric, label) triple so the
// export mirrors exactly what's on screen, nothing more.

import { csvResponse, rowsToCsv, type CsvColumn } from "@/lib/csv";
import { getReportsSummary } from "@/lib/reports-api";

interface SummaryRow {
  section: string;
  metric: string;
  label: string;
  value: string | number;
}

export async function GET() {
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

  const columns: CsvColumn<SummaryRow>[] = [
    { header: "Section", value: (r) => r.section },
    { header: "Metric", value: (r) => r.metric },
    { header: "Label", value: (r) => r.label },
    { header: "Value", value: (r) => r.value },
  ];

  return csvResponse(rowsToCsv(columns, rows), "admin-reports-summary.csv");
}
