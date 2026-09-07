import { NextRequest } from "next/server";
import { csvResponse, rowsToCsv } from "@/lib/csv";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { formatDate, formatTime } from "@/lib/format";
import type { LibraryTransactionHistoryEntry } from "@/lib/library-api";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = new URLSearchParams();
  for (const key of ["startDate", "endDate"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }

  const { rows } = await fetchAllPages<LibraryTransactionHistoryEntry>("/library/reports/transaction-history", query);

  const csv = rowsToCsv(
    [
      { header: "Date", value: (r) => `${formatDate(r.occurredAt)} ${formatTime(r.occurredAt)}` },
      { header: "Action", value: (r) => r.action },
      { header: "Detail", value: (r) => r.detail ?? "" },
      { header: "Operator", value: (r) => r.actorName ?? "" },
      { header: "Outcome", value: (r) => r.outcome },
    ],
    rows,
  );

  return csvResponse(csv, "library-transaction-history-report.csv");
}
