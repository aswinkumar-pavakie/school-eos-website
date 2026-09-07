import { NextRequest } from "next/server";
import { csvResponse, rowsToCsv } from "@/lib/csv";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { formatMoneySummary } from "@/lib/format";

interface FeeDemandRow {
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

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = new URLSearchParams();
  for (const key of ["search", "academicYearId", "gradeId", "sectionId", "state"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }

  const { rows } = await fetchAllPages<FeeDemandRow>("/fee-demands", query);

  const csv = rowsToCsv(
    [
      { header: "Student", value: (r) => `${r.studentFirstName} ${r.studentLastName ?? ""}`.trim() },
      { header: "Admission No.", value: (r) => r.admissionNo },
      { header: "Class", value: (r) => (r.gradeName ? `${r.gradeName} ${r.sectionName ?? ""}`.trim() : "") },
      { header: "Fee Type", value: (r) => r.feeHeadName ?? "" },
      { header: "Total Fee", value: (r) => formatMoneySummary(r.amountPaise) },
      { header: "Paid", value: (r) => formatMoneySummary(r.paidPaise) },
      { header: "Pending", value: (r) => formatMoneySummary(r.pendingPaise) },
      { header: "Due Date", value: (r) => r.dueDate },
      { header: "Status", value: (r) => r.state },
    ],
    rows,
  );

  return csvResponse(csv, "fee-status.csv");
}
