// Export for the Admin Students list -- reuses GET /students verbatim with the
// same filters (search/status/gradeId/sectionId/sectionName) the page itself
// applies, and fetchAllPages so the export covers every filtered row, not just
// the current 50-per-page slice.

import { NextRequest } from "next/server";
import { csvResponse, rowsToCsv, type CsvColumn } from "@/lib/csv";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { formatDate } from "@/lib/format";

interface StudentRow {
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

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = new URLSearchParams();
  for (const key of ["search", "status", "gradeId", "sectionId", "sectionName"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }

  const { rows } = await fetchAllPages<StudentRow>("/students", query);

  const columns: CsvColumn<StudentRow>[] = [
    { header: "Name", value: (r) => `${r.firstName} ${r.lastName ?? ""}`.trim() },
    { header: "Admission No", value: (r) => r.admissionNo },
    { header: "Class", value: (r) => (r.gradeName ? `${r.gradeName} ${r.sectionName ?? ""}`.trim() : "Unassigned") },
    { header: "Roll No", value: (r) => r.rollNo ?? "" },
    { header: "Admitted", value: (r) => formatDate(r.admissionDate) },
    { header: "Status", value: (r) => r.status },
    { header: "Hosteller", value: (r) => (r.isHosteller ? "Yes" : "No") },
  ];

  return csvResponse(rowsToCsv(columns, rows), "students.csv");
}
