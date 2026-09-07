import { NextRequest } from "next/server";
import { csvResponse, rowsToCsv } from "@/lib/csv";
import { fetchAllPages } from "@/lib/fetch-all-pages";

interface InventoryItemRow {
  name: string;
  categoryName: string;
  assetCode: string | null;
  quantity: number;
  location: string | null;
  status: string;
  assignedToName: string | null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = new URLSearchParams();
  for (const key of ["search", "categoryId", "status", "location"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }

  const { rows } = await fetchAllPages<InventoryItemRow>("/inventory-items", query);

  const csv = rowsToCsv(
    [
      { header: "Name", value: (r) => r.name },
      { header: "Category", value: (r) => r.categoryName },
      { header: "Asset Code", value: (r) => r.assetCode ?? "" },
      { header: "Quantity", value: (r) => r.quantity },
      { header: "Location", value: (r) => r.location ?? "" },
      { header: "Status", value: (r) => r.status },
      { header: "Assigned To", value: (r) => r.assignedToName ?? "" },
    ],
    rows,
  );

  return csvResponse(csv, "inventory-items.csv");
}
