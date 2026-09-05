import { PrintReportHeader, PrintReportStyles } from "@/components/dashboard/PrintReport";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fetchAllPages } from "@/lib/fetch-all-pages";

interface InventoryItemRow {
  id: string;
  name: string;
  categoryName: string;
  assetCode: string | null;
  quantity: number;
  location: string | null;
  status: string;
  assignedToName: string | null;
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "AVAILABLE") return "success";
  if (status === "DAMAGED" || status === "LOST") return "critical";
  return "pending";
}

export default async function InventoryItemsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; categoryId?: string; status?: string; location?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  const filterParts: string[] = [];
  for (const key of ["search", "categoryId", "status", "location"] as const) {
    if (params[key]) {
      query.set(key, params[key]!);
      filterParts.push(`${key}=${params[key]}`);
    }
  }

  const { rows, total, truncated } = await fetchAllPages<InventoryItemRow>("/inventory-items", query);

  return (
    <div className="p-8">
      <PrintReportStyles />
      <PrintReportHeader
        title="Inventory Items Report"
        subtitle={`${rows.length}${truncated ? ` of ${total}` : ""} items`}
        filterSummary={filterParts.length > 0 ? filterParts.join(", ") : undefined}
      />
      <table className="report-table w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b-2 border-border text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Category</th>
            <th className="py-2 pr-3">Quantity</th>
            <th className="py-2 pr-3">Location</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Assigned To</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <td className="py-1.5 pr-3">
                {r.name}
                {r.assetCode && <span className="ml-1.5 font-mono text-[10px] text-text-muted">{r.assetCode}</span>}
              </td>
              <td className="py-1.5 pr-3">{r.categoryName}</td>
              <td className="py-1.5 pr-3">{r.quantity}</td>
              <td className="py-1.5 pr-3">{r.location ?? "—"}</td>
              <td className="py-1.5 pr-3">
                <StatusPill tone={statusTone(r.status)} label={r.status} />
              </td>
              <td className="py-1.5 pr-3">{r.assignedToName ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
