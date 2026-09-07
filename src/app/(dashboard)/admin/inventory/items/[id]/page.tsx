// Inventory item detail -- stock/status actions (add stock, issue, return,
// transfer, adjust, mark damaged/lost, retire) plus a link to this item's full
// audit history (same /admin/audit?objectType=...&objectId=... pattern already
// used for enrolment history) and any repair requests raised against it -- the
// one Inventory <-> Repair integration point, surfaced here rather than
// duplicated as a second history mechanism.

import { notFound } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { InventoryItemActions } from "@/components/inventory/InventoryItemActions";
import { apiFetch } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";

interface InventoryItemDetail {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  assetCode: string | null;
  quantity: number;
  lowStockThreshold: number | null;
  location: string | null;
  status: string;
  assignedToPersonId: string | null;
  assignedToName: string | null;
  assignedOn: string | null;
  description: string | null;
  acquisitionDate: string | null;
  acquisitionCostPaise: string | null;
  vendor: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RepairRequestSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  requestedOn: string;
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "AVAILABLE") return "success";
  if (status === "DAMAGED" || status === "LOST") return "critical";
  return "pending";
}

function repairStatusTone(status: string): "success" | "pending" | "critical" {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "critical";
  return "pending";
}

export default async function InventoryItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [itemRes, repairsRes] = await Promise.all([
    apiFetch(`/inventory-items/${id}`),
    apiFetch(`/repair-requests?inventoryItemId=${id}`),
  ]);

  if (itemRes.status === 404) notFound();
  if (!itemRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this item</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: item } = (await itemRes.json()) as { data: InventoryItemDetail };
  const repairRequests: RepairRequestSummary[] = repairsRes.ok
    ? ((await repairsRes.json()) as { data: RepairRequestSummary[] }).data
    : [];

  return (
    <div className="mx-auto max-w-[860px]">
      <BackLink href="/admin/inventory" label="Back to Inventory" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">{item.name}</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {item.categoryName}
            {item.assetCode && <span className="font-mono"> · {item.assetCode}</span>} · Qty {item.quantity}
            {item.location ? ` · ${item.location}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone={statusTone(item.status)} label={item.status} />
          <Link
            href={`/admin/audit?objectType=inventory_item&objectId=${item.id}&returnTo=${encodeURIComponent(`/admin/inventory/items/${item.id}`)}`}
            className="text-[13px] font-semibold text-primary"
          >
            View history
          </Link>
        </div>
      </div>

      {item.assignedToName && (
        <p className="mt-2 text-sm text-text-muted">
          Currently issued to <span className="font-semibold text-text">{item.assignedToName}</span>
          {item.assignedOn && ` since ${formatDate(item.assignedOn)}`}
        </p>
      )}

      <section className="mt-8 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Details</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Description</dt>
            <dd className="mt-0.5 text-text">{item.description ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Vendor</dt>
            <dd className="mt-0.5 text-text">{item.vendor ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Acquisition date</dt>
            <dd className="mt-0.5 text-text">{item.acquisitionDate ? formatDate(item.acquisitionDate) : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Acquisition cost</dt>
            <dd className="mt-0.5 text-text">
              {item.acquisitionCostPaise ? formatMoney(item.acquisitionCostPaise) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Low-stock threshold</dt>
            <dd className="mt-0.5 text-text">{item.lowStockThreshold ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Stock &amp; status actions</h2>
        <div className="mt-3">
          <InventoryItemActions item={item} />
        </div>
      </section>

      <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Repair requests for this item</h2>
          <Link
            href={`/admin/maintenance?inventoryItemId=${item.id}&new=1`}
            className="text-[13px] font-semibold text-primary"
          >
            + New request
          </Link>
        </div>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {repairRequests.length === 0 && (
            <li className="py-3 text-sm text-text-muted">No repair requests raised for this item.</li>
          )}
          {repairRequests.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="font-semibold text-text">{r.title}</p>
                <p className="text-xs text-text-muted">
                  {r.priority.toLowerCase()} priority · requested {formatDate(r.requestedOn)}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <StatusPill tone={repairStatusTone(r.status)} label={r.status.replace(/_/g, " ")} />
                <Link href={`/admin/maintenance/${r.id}`} className="text-[13px] font-semibold text-primary">
                  View
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
