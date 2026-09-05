// Repair & Maintenance -- Admin feature for general school assets/equipment/
// facilities. Vehicle repair/maintenance stays under Transport -> Vehicles
// (untouched, not duplicated here). Overview counts (same KpiCard as the Admin
// dashboard) + a searchable, paginated request list (same pattern as the
// Students list).

import Link from "next/link";
import { CreateRepairRequestModal } from "@/components/maintenance/CreateRepairRequestModal";
import { MaintenanceFilterBar } from "@/components/maintenance/MaintenanceFilterBar";
import { ExportCsvLink } from "@/components/dashboard/ExportCsvLink";
import { MaintenanceIcon } from "@/components/dashboard/icons";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
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

interface OverviewCounts {
  total: number;
  requested: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

const STATUS_TABS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "REQUESTED", label: "Requested" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

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

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    priority?: string;
    issueType?: string;
    location?: string;
    inventoryItemId?: string;
    new?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.priority) query.set("priority", params.priority);
  if (params.issueType) query.set("issueType", params.issueType);
  if (params.location) query.set("location", params.location);
  query.set("page", String(page));
  query.set("limit", "50");

  const [requestsRes, overviewRes, presetItemRes] = await Promise.all([
    apiFetch(`/repair-requests?${query.toString()}`),
    apiFetch("/repair-requests/overview"),
    params.inventoryItemId ? apiFetch(`/inventory-items/${params.inventoryItemId}`) : Promise.resolve(null),
  ]);

  if (!requestsRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Repair &amp; Maintenance</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: requests, meta } = (await requestsRes.json()) as {
    data: RepairRequestRow[];
    meta: { page: number; limit: number; total: number };
  };
  const overview: OverviewCounts | null = overviewRes.ok
    ? ((await overviewRes.json()) as { data: OverviewCounts }).data
    : null;
  const presetItem =
    presetItemRes && presetItemRes.ok
      ? ((await presetItemRes.json()) as { data: { id: string; name: string; assetCode: string | null } }).data
      : null;
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.search) next.set("search", params.search);
    if (params.status) next.set("status", params.status);
    if (params.priority) next.set("priority", params.priority);
    if (params.issueType) next.set("issueType", params.issueType);
    if (params.location) next.set("location", params.location);
    next.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    return `/admin/maintenance?${next.toString()}`;
  }

  function filterQuery() {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.status) q.set("status", params.status);
    if (params.priority) q.set("priority", params.priority);
    if (params.issueType) q.set("issueType", params.issueType);
    if (params.location) q.set("location", params.location);
    return q.toString();
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Repair &amp; Maintenance</h1>
          <p className="mt-1 text-sm text-text-muted">{meta.total} requests -- general assets, equipment &amp; facilities</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/print/maintenance/requests?${filterQuery()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-semibold text-text hover:bg-bg"
          >
            Print / PDF
          </Link>
          <ExportCsvLink href={`/api/export/maintenance-requests?${filterQuery()}`} />
          <CreateRepairRequestModal
            presetItem={presetItem ? { id: presetItem.id, label: presetItem.assetCode ? `${presetItem.name} (${presetItem.assetCode})` : presetItem.name } : undefined}
            defaultOpen={params.new === "1"}
          />
        </div>
      </div>

      {overview && (
        <div className="mt-6 grid grid-cols-2 gap-[14px] sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard eyebrow="Total requests" value={String(overview.total)} detail="All repair & maintenance work" icon={<MaintenanceIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Requested" value={String(overview.requested)} detail="Awaiting assignment" icon={<MaintenanceIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Assigned" value={String(overview.assigned)} detail="Awaiting work to start" icon={<MaintenanceIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="In progress" value={String(overview.inProgress)} detail="Being worked on" icon={<MaintenanceIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Completed" value={String(overview.completed)} detail="Fixed & closed" icon={<MaintenanceIcon className="h-5 w-5" />} />
        </div>
      )}

      <MaintenanceFilterBar
        search={params.search ?? ""}
        priority={params.priority ?? ""}
        issueType={params.issueType ?? ""}
        location={params.location ?? ""}
        status={params.status}
      />

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const active = (params.status ?? undefined) === tab.value;
          return (
            <Link
              key={tab.label}
              href={hrefWith({ status: tab.value, page: "1" })}
              className={`whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                active ? "bg-primary text-white" : "bg-field text-text-muted hover:bg-border"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Item / location</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  No repair requests match this filter.
                </td>
              </tr>
            )}
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-semibold text-text">{r.title}</td>
                <td className="px-4 py-3 text-text-muted">{r.inventoryItemName ?? r.location ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={priorityTone(r.priority)} label={r.priority} />
                </td>
                <td className="px-4 py-3 text-text-muted">{formatDate(r.requestedOn)}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={statusTone(r.status)} label={r.status.replace(/_/g, " ")} />
                  {r.assignedToName && <p className="mt-0.5 text-xs text-text-muted">to {r.assignedToName}</p>}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/maintenance/${r.id}`} className="text-[13px] font-semibold text-primary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
          <span>
            Page {meta.page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={hrefWith({ page: String(page - 1) })} className="font-semibold text-primary">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={hrefWith({ page: String(page + 1) })} className="font-semibold text-primary">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
