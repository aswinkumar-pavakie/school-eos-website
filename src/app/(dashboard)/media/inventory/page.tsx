import { redirect } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { KpiCard, KpiGrid } from "@/components/ui/KpiCard";
import { PlainButton } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getMediaInventoryOverview, listMediaInventory } from "@/lib/media-api";
import { CreateMediaInventoryItemModal } from "./CreateMediaInventoryItemModal";
import { EditMediaInventoryItemModal } from "./EditMediaInventoryItemModal";

export default async function MediaInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const { search, status } = await searchParams;
  try {
    const [{ data: items, meta }, overview] = await Promise.all([
      listMediaInventory({ search: search || undefined, status: status || undefined }),
      getMediaInventoryOverview(),
    ]);

    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Inventory</h1>
            <p className="mt-1 text-sm text-text-muted">Cameras, lenses, audio and lighting equipment register — issue, return and service history per unit.</p>
          </div>
          <CreateMediaInventoryItemModal />
        </div>

        <KpiGrid>
          <KpiCard eyebrow="Total assets" value={String(overview.total)} delta={`Book value ${formatMoneySummary(String(overview.bookValuePaise))}`} />
          <KpiCard eyebrow="Available" value={String(overview.available)} delta="Ready to issue" />
          <KpiCard eyebrow="Issued out" value={String(overview.assigned)} delta="Currently with crew" />
          <KpiCard eyebrow="Under repair" value={String(overview.underRepair)} delta="Marked damaged" />
        </KpiGrid>

        <form action="/media/inventory" className="flex flex-wrap items-center gap-3">
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search name, category, tag or serial no."
            className="min-w-64 flex-1 rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
          />
          <select name="status" defaultValue={status ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
            <option value="">All statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="DAMAGED">Damaged</option>
            <option value="LOST">Lost</option>
            <option value="RETIRED">Retired</option>
          </select>
          <PlainButton type="submit" variant="secondary">Filter</PlainButton>
        </form>
        <p className="-mt-3 text-xs text-text-muted">{meta.total} asset{meta.total === 1 ? "" : "s"}</p>

        {items.length === 0 ? (
          <EmptyState title="No equipment registered yet" body="Add your first camera, lens or audio/lighting asset." />
        ) : (
          <DataTable
            getKey={(i) => i.id}
            rows={items}
            columns={[
              {
                header: "Asset tag",
                render: (i) => <span className="font-mono font-bold text-primary">{i.assetCode ?? "—"}</span>,
              },
              {
                header: "Equipment",
                render: (i) => (
                  <div>
                    <div className="font-bold text-text">{i.name}</div>
                    <div className="text-xs text-text-muted">{i.description ?? "—"}</div>
                  </div>
                ),
              },
              { header: "Category", render: (i) => i.categoryName },
              { header: "Location", render: (i) => i.location ?? "—" },
              { header: "Status", render: (i) => <StatusPill state={i.status} /> },
              { header: "", render: (i) => <EditMediaInventoryItemModal item={i} /> },
            ]}
          />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load inventory. Nothing was submitted — try again." />;
  }
}
