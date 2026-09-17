// Inventory -- pixel-rebuilt from the design's own isInventory screen
// (stat tiles + status filters + expandable-row detail with real movement
// history). Real inventory_item data scoped to the Media & AV Equipment
// category (listMediaInventory/getMediaInventoryOverview/issue/return/
// mark-damaged), plus a new, real "movement history" read wired to this
// item's own already-recorded audit_event trail (see media-inventory.controller.ts's
// own comment) -- not a new table, genuinely already-captured data.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/media-ui/primitives";
import { formatMoneySummary } from "@/lib/format";
import { AuthExpiredError } from "@/lib/api";
import { getMediaInventoryOverview, listMediaInventory, listMediaTeam } from "@/lib/media-api";
import { AddAssetPanel } from "./AddAssetPanel";
import { InventoryRow } from "./InventoryRow";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "AVAILABLE", label: "Available" },
  { value: "ASSIGNED", label: "Issued" },
  { value: "DAMAGED", label: "In service" },
  { value: "LOST", label: "Lost" },
  { value: "RETIRED", label: "Retired" },
];

export default async function MediaInventoryPage({ searchParams }: { searchParams: Promise<{ search?: string; status?: string }> }) {
  const { search, status } = await searchParams;
  try {
    const [{ data: items, meta }, overview, crew] = await Promise.all([
      listMediaInventory({ search: search || undefined, status: status || undefined }),
      getMediaInventoryOverview(),
      listMediaTeam(),
    ]);

    return (
      <div className="media-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1.1 }}>Inventory</div>
            <div style={{ fontSize: 15.5, color: "var(--med-body-muted)", marginTop: 10 }}>{overview.total} assets tagged to the media room · issue, return and service history per unit</div>
          </div>
          <AddAssetPanel />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 20, marginTop: 28 }}>
          <div className="media-card-hover" style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "20px 24px", cursor: "pointer" }}>
            <div style={{ fontSize: 14.5, color: "var(--med-body)", fontWeight: 600 }}>Total assets</div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1.2px", marginTop: 10 }}>{overview.total}</div>
            <div style={{ fontSize: 13, color: "var(--med-tertiary)", marginTop: 4 }}>book value {formatMoneySummary(String(overview.bookValuePaise))}</div>
          </div>
          <div className="media-card-hover" style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "20px 24px", cursor: "pointer" }}>
            <div style={{ fontSize: 14.5, color: "var(--med-body)", fontWeight: 600 }}>Available</div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1.2px", marginTop: 10, color: "var(--med-green)" }}>{overview.available}</div>
            <div style={{ fontSize: 13, color: "var(--med-tertiary)", marginTop: 4 }}>ready to issue</div>
          </div>
          <div className="media-card-hover" style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "20px 24px", cursor: "pointer" }}>
            <div style={{ fontSize: 14.5, color: "var(--med-body)", fontWeight: 600 }}>Issued out</div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1.2px", marginTop: 10, color: "var(--med-primary)" }}>{overview.assigned}</div>
            <div style={{ fontSize: 13, color: "var(--med-tertiary)", marginTop: 4 }}>currently with crew</div>
          </div>
          <div className="media-card-hover" style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "20px 24px", cursor: "pointer" }}>
            <div style={{ fontSize: 14.5, color: "var(--med-body)", fontWeight: 600 }}>In service</div>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1.2px", marginTop: 10, color: "var(--med-amber)" }}>{overview.underRepair}</div>
            <div style={{ fontSize: 13, color: "var(--med-tertiary)", marginTop: 4 }}>marked damaged</div>
          </div>
        </div>

        <form action="/media/inventory" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
          <input name="search" defaultValue={search ?? ""} placeholder="Search name, category, tag or serial no." style={{ flex: 1, minWidth: 240, height: 44, border: "1px solid var(--med-border)", borderRadius: 11, padding: "0 14px", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} type="submit" name="status" value={f.value} style={{ border: (status ?? "") === f.value ? "1px solid var(--med-navy)" : "1px solid var(--med-border)", background: (status ?? "") === f.value ? "var(--med-navy)" : "#fff", color: (status ?? "") === f.value ? "#fff" : "var(--med-ink)", borderRadius: 9, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {f.label}
            </button>
          ))}
        </form>
        <div style={{ fontSize: 12.5, color: "var(--med-tertiary)", marginTop: 6 }}>{meta.total} asset{meta.total === 1 ? "" : "s"}</div>

        {items.length === 0 ? (
          <div style={{ marginTop: 20 }}><EmptyPanel label="Add your first camera, lens or audio/lighting asset." /></div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, marginTop: 20, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.7fr 1fr 1.2fr 1fr 0.9fr", gap: 16, padding: "16px 26px", borderBottom: "1px solid var(--med-divider-2)" }}>
              {["ASSET TAG", "EQUIPMENT", "CATEGORY", "HOLDER / LOCATION", "CONDITION", "STATUS"].map((h) => (
                <span key={h} style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary)" }}>{h}</span>
              ))}
            </div>
            {items.map((i) => (
              <InventoryRow key={i.id} item={i} crew={crew} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load inventory."} />;
  }
}
