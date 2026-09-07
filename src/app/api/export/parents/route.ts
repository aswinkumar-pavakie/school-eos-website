// Export for the Admin Parents list -- reuses GET /parents verbatim with the
// same filters (search/status) the page itself applies, and fetchAllPages so
// the export covers every filtered row, not just the current 50-per-page slice.

import { NextRequest } from "next/server";
import { csvResponse, rowsToCsv, type CsvColumn } from "@/lib/csv";
import { fetchAllPages } from "@/lib/fetch-all-pages";

interface ParentRow {
  firstName: string;
  lastName: string | null;
  email: string | null;
  mobile: string | null;
  status: string;
  childrenCount: number;
  occupation: string | null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = new URLSearchParams();
  for (const key of ["search", "status"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }

  const { rows } = await fetchAllPages<ParentRow>("/parents", query);

  const columns: CsvColumn<ParentRow>[] = [
    { header: "Name", value: (r) => `${r.firstName} ${r.lastName ?? ""}`.trim() },
    { header: "Occupation", value: (r) => r.occupation ?? "" },
    { header: "Mobile", value: (r) => r.mobile ?? "" },
    { header: "Email", value: (r) => r.email ?? "" },
    { header: "Children Linked", value: (r) => r.childrenCount },
    { header: "Status", value: (r) => r.status },
  ];

  return csvResponse(rowsToCsv(columns, rows), "parents.csv");
}
