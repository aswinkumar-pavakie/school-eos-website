import { NextRequest } from "next/server";
import { csvResponse, rowsToCsv } from "@/lib/csv";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { formatDate } from "@/lib/format";

interface RepairRequestRow {
  title: string;
  inventoryItemName: string | null;
  issueType: string;
  location: string | null;
  priority: string;
  status: string;
  requestedOn: string;
  assignedToName: string | null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = new URLSearchParams();
  for (const key of ["search", "status", "priority", "issueType", "location"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }

  const { rows } = await fetchAllPages<RepairRequestRow>("/repair-requests", query);

  const csv = rowsToCsv(
    [
      { header: "Title", value: (r) => r.title },
      { header: "Item / Location", value: (r) => r.inventoryItemName ?? r.location ?? "" },
      { header: "Issue Type", value: (r) => r.issueType },
      { header: "Priority", value: (r) => r.priority },
      { header: "Requested On", value: (r) => formatDate(r.requestedOn) },
      { header: "Assigned To", value: (r) => r.assignedToName ?? "" },
      { header: "Status", value: (r) => r.status },
    ],
    rows,
  );

  return csvResponse(csv, "repair-requests.csv");
}
