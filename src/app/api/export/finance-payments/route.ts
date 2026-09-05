import { NextRequest } from "next/server";
import { csvResponse, rowsToCsv } from "@/lib/csv";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { formatDate, formatMoneySummary } from "@/lib/format";

interface PaymentRow {
  studentFirstName: string | null;
  studentLastName: string | null;
  admissionNo: string | null;
  amountPaise: string;
  mode: string;
  state: string;
  confirmedAt: string | null;
  initiatedAt: string;
  receiptNo: string | null;
  collectedByName: string | null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = new URLSearchParams();
  for (const key of ["search", "state", "mode"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }

  const { rows } = await fetchAllPages<PaymentRow>("/payments", query);

  const csv = rowsToCsv(
    [
      { header: "Student", value: (r) => (r.studentFirstName ? `${r.studentFirstName} ${r.studentLastName ?? ""}`.trim() : "") },
      { header: "Admission No.", value: (r) => r.admissionNo ?? "" },
      { header: "Amount", value: (r) => formatMoneySummary(r.amountPaise) },
      { header: "Mode", value: (r) => r.mode },
      { header: "Date", value: (r) => formatDate(r.confirmedAt ?? r.initiatedAt) },
      { header: "Receipt No.", value: (r) => r.receiptNo ?? "" },
      { header: "Collected By", value: (r) => r.collectedByName ?? "" },
      { header: "Status", value: (r) => r.state },
    ],
    rows,
  );

  return csvResponse(csv, "payments.csv");
}
