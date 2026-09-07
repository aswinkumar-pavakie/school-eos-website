// Export for the Admin Attendance page -- reuses GET /staff-attendance verbatim
// with the exact same filters (date/isTeaching/gradeId/sectionId/subjectId) the
// page itself applies, so the export always matches what's on screen.

import { NextRequest } from "next/server";
import { csvResponse, rowsToCsv, type CsvColumn } from "@/lib/csv";
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

function statusLabel(status: string | null): string {
  if (status === "CHECK_IN") return "Present";
  if (status === "ABSENT") return "Absent";
  return "Not marked";
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = new URLSearchParams();
  for (const key of ["date", "isTeaching", "gradeId", "sectionId", "subjectId"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }

  const res = await apiFetch(`/staff-attendance?${query.toString()}`);
  const roster: StaffDailyStatus[] = res.ok ? ((await res.json()) as { data: StaffDailyStatus[] }).data : [];

  const columns: CsvColumn<StaffDailyStatus>[] = [
    { header: "Employee No", value: (r) => r.employeeNo },
    { header: "Name", value: (r) => `${r.firstName} ${r.lastName ?? ""}`.trim() },
    { header: "Designation", value: (r) => r.designation ?? "" },
    { header: "Status", value: (r) => statusLabel(r.status) },
    { header: "Marked At", value: (r) => r.markedAt ?? "" },
    { header: "Reason", value: (r) => r.reason ?? "" },
  ];

  const date = query.get("date") ?? "attendance";
  return csvResponse(rowsToCsv(columns, roster), `staff-attendance-${date}.csv`);
}
