// Inventory Management -- Admin feature for school-owned assets/stock. Overview
// counts (component 02, same KpiCard as the Admin dashboard) + a searchable,
// paginated item list (same pattern as the Students list) + configurable
// categories (see /admin/inventory/categories). Every value is real data.

import Link from "next/link";
import { CreateInventoryItemModal } from "@/components/inventory/CreateInventoryItemModal";
import { InventoryFilterBar } from "@/components/inventory/InventoryFilterBar";
import { ExportCsvLink } from "@/components/dashboard/ExportCsvLink";
import { InventoryIcon } from "@/components/dashboard/icons";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";

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

interface Category {
  id: string;
  name: string;
}

interface OverviewCounts {
  total: number;
  available: number;
  assigned: number;
  damaged: number;
  lost: number;
  retired: number;
  lowStock: number;
}

const STATUS_TABS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "AVAILABLE", label: "Available" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "LOST", label: "Lost" },
  { value: "RETIRED", label: "Retired" },
];

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "AVAILABLE") return "success";
  if (status === "DAMAGED" || status === "LOST") return "critical";
  return "pending";
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; categoryId?: string; status?: string; location?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.status) query.set("status", params.status);
  if (params.location) query.set("location", params.location);
  query.set("page", String(page));
  query.set("limit", "50");

  const [itemsRes, overviewRes, categoriesRes] = await Promise.all([
    apiFetch(`/inventory-items?${query.toString()}`),
    apiFetch("/inventory-items/overview"),
    apiFetch("/inventory-categories"),
  ]);

  if (!itemsRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Inventory</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: items, meta } = (await itemsRes.json()) as {
    data: InventoryItemRow[];
    meta: { page: number; limit: number; total: number };
  };
  const overview: OverviewCounts | null = overviewRes.ok
    ? ((await overviewRes.json()) as { data: OverviewCounts }).data
    : null;
  const categories: Category[] = categoriesRes.ok ? ((await categoriesRes.json()) as { data: Category[] }).data : [];
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (params.search) next.set("search", params.search);
    if (params.categoryId) next.set("categoryId", params.categoryId);
    if (params.status) next.set("status", params.status);
    if (params.location) next.set("location", params.location);
    next.set("page", String(page));
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    return `/admin/inventory?${next.toString()}`;
  }

  function filterQuery() {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.categoryId) q.set("categoryId", params.categoryId);
    if (params.status) q.set("status", params.status);
    if (params.location) q.set("location", params.location);
    return q.toString();
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">Inventory</h1>
          <p className="mt-1 text-sm text-text-muted">{meta.total} inventory items</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/print/inventory/items?${filterQuery()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-semibold text-text hover:bg-bg"
          >
            Print / PDF
          </Link>
          <ExportCsvLink href={`/api/export/inventory-items?${filterQuery()}`} />
          <CreateInventoryItemModal categories={categories} />
        </div>
      </div>

      {overview && (
        <div className="mt-6 grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard eyebrow="Total items" value={String(overview.total)} detail="All tracked assets & stock" icon={<InventoryIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Available" value={String(overview.available)} detail="Ready to issue" icon={<InventoryIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Assigned" value={String(overview.assigned)} detail="Currently issued out" icon={<InventoryIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Damaged" value={String(overview.damaged)} detail="Needs repair" icon={<InventoryIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Lost" value={String(overview.lost)} detail="Unaccounted for" icon={<InventoryIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Retired" value={String(overview.retired)} detail="Disposed / decommissioned" icon={<InventoryIcon className="h-5 w-5" />} />
          <KpiCard eyebrow="Low stock" value={String(overview.lowStock)} detail="At or below threshold" icon={<InventoryIcon className="h-5 w-5" />} />
        </div>
      )}

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-border">
        <Link href="/admin/inventory" className="whitespace-nowrap border-b-2 border-primary px-1 pb-2 text-[13px] font-semibold text-primary">
          Items
        </Link>
        <Link href="/admin/inventory/categories" className="whitespace-nowrap border-b-2 border-transparent px-1 pb-2 text-[13px] font-semibold text-text-muted hover:text-text">
          Categories
        </Link>
      </div>

      <InventoryFilterBar
        search={params.search ?? ""}
        categoryId={params.categoryId ?? ""}
        location={params.location ?? ""}
        status={params.status}
        categories={categories}
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
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  No inventory items match this filter.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-semibold text-text">
                  {item.name}
                  {item.assetCode && <p className="font-mono text-xs font-normal text-text-muted">{item.assetCode}</p>}
                </td>
                <td className="px-4 py-3 text-text-muted">{item.categoryName}</td>
                <td className="px-4 py-3 text-text-muted">{item.quantity}</td>
                <td className="px-4 py-3 text-text-muted">{item.location ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={statusTone(item.status)} label={item.status} />
                  {item.assignedToName && <p className="mt-0.5 text-xs text-text-muted">to {item.assignedToName}</p>}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/inventory/items/${item.id}`} className="text-[13px] font-semibold text-primary">
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
