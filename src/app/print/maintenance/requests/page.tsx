import { PrintReportHeader, PrintReportStyles } from "@/components/dashboard/PrintReport";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fetchAllPages } from "@/lib/fetch-all-pages";
import { formatDate } from "@/lib/format";

interface RepairRequestRow {
  id: string;
  title: string;
  inventoryItemName: string | null;
  issueType: string;
  location: string | null;
  priority: string;
  status: string;
  requestedOn: string;
  assignedToName: string | null;
}

function priorityTone(priority: string): "success" | "pending" | "critical" {
  if (priority === "URGENT" || priority === "HIGH") return "critical";
  if (priority === "LOW") return "success";
  return "pending";
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "critical";
  return "pending";
}

export default async function MaintenanceRequestsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; priority?: string; issueType?: string; location?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  const filterParts: string[] = [];
  for (const key of ["search", "status", "priority", "issueType", "location"] as const) {
    if (params[key]) {
      query.set(key, params[key]!);
      filterParts.push(`${key}=${params[key]}`);
    }
  }

  const { rows, total, truncated } = await fetchAllPages<RepairRequestRow>("/repair-requests", query);

  return (
    <div className="p-8">
      <PrintReportStyles />
      <PrintReportHeader
        title="Repair & Maintenance Report"
        subtitle={`${rows.length}${truncated ? ` of ${total}` : ""} requests — general assets/equipment/facilities`}
        filterSummary={filterParts.length > 0 ? filterParts.join(", ") : undefined}
      />
      <table className="report-table w-full border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b-2 border-border text-[10px] font-bold uppercase tracking-[0.06em] text-text-muted">
            <th className="py-2 pr-3">Title</th>
            <th className="py-2 pr-3">Item / Location</th>
            <th className="py-2 pr-3">Priority</th>
            <th className="py-2 pr-3">Requested On</th>
            <th className="py-2 pr-3">Assigned To</th>
            <th className="py-2 pr-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <td className="py-1.5 pr-3">{r.title}</td>
              <td className="py-1.5 pr-3">{r.inventoryItemName ?? r.location ?? "—"}</td>
              <td className="py-1.5 pr-3">
                <StatusPill tone={priorityTone(r.priority)} label={r.priority} />
              </td>
              <td className="py-1.5 pr-3">{formatDate(r.requestedOn)}</td>
              <td className="py-1.5 pr-3">{r.assignedToName ?? "—"}</td>
              <td className="py-1.5 pr-3">
                <StatusPill tone={statusTone(r.status)} label={r.status.replace(/_/g, " ")} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
