// Export for the Admin Faculty & Staff list -- reuses GET /staff verbatim with
// the same filters the page itself applies, and fetchAllPages so the export
// covers every filtered row, not just the current 50-per-page slice.

import { NextRequest } from "next/server";
import { csvResponse, rowsToCsv, type CsvColumn } from "@/lib/csv";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { formatDate } from "@/lib/format";

interface StaffRow {
  firstName: string;
  lastName: string | null;
  employeeNo: string;
  designation: string | null;
  isTeaching: boolean;
  dateOfJoining: string;
  status: string;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = new URLSearchParams();
  for (const key of ["search", "status", "isTeaching", "designation", "gradeId", "sectionId", "subjectId"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }

  const { rows } = await fetchAllPages<StaffRow>("/staff", query);

  const columns: CsvColumn<StaffRow>[] = [
    { header: "Name", value: (r) => `${r.firstName} ${r.lastName ?? ""}`.trim() },
    { header: "Employee No", value: (r) => r.employeeNo },
    { header: "Designation", value: (r) => r.designation ?? "" },
    { header: "Teaching", value: (r) => (r.isTeaching ? "Yes" : "No") },
    { header: "Joined", value: (r) => formatDate(r.dateOfJoining) },
    { header: "Status", value: (r) => r.status },
  ];

  return csvResponse(rowsToCsv(columns, rows), "faculty.csv");
}
