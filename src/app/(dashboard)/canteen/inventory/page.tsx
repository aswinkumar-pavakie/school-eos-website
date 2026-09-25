// Canteen Inventory -- the real heart of this login, per its own explicit
// requirement: full product CRUD (name, optional photo, quantity on hand,
// price per unit in ₹). Quantity here is the SAME row the Ledger sells
// against and the SAME row a charge decrements (CanteenRepository.
// chargeWallet, inside the one atomic sale transaction) -- there is no
// second, separate stock count anywhere. Redesigned to a premium,
// enterprise-grade product-catalog look: real stat tiles, a stock-level
// bar per card (not just a number), gradient placeholder art for
// photo-less products, icon-only actions -- every number still a real,
// live aggregate off canteen_product, nothing decorative faked.

import { listCanteenProducts } from "@/lib/canteen-api";
import { formatMoneyDetail } from "@/lib/format";
import { Card, StatTile } from "@/components/canteen-ui/primitives";
import { DefaultProductIcon } from "@/components/canteen-ui/DefaultProductIcon";
import { BoxIcon, AlertTriangleIcon, WalletIcon, PlusIcon, EditIcon } from "@/components/canteen-ui/icons";
import { ProductFormModal } from "./ProductFormModal";
import { DeleteProductButton } from "./DeleteProductButton";

const LOW_STOCK_THRESHOLD = 5;
const STOCK_BAR_SCALE = LOW_STOCK_THRESHOLD * 4;

export default async function CanteenInventoryPage() {
  const products = await listCanteenProducts().catch(() => []);
  const totalValuePaise = products.reduce((sum, p) => sum + p.quantity * p.pricePerUnitPaise, 0);
  const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStock = products.filter((p) => p.quantity <= LOW_STOCK_THRESHOLD);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 style={{ margin: 0, font: "700 36px/1.1 var(--can-font-sans)", letterSpacing: "-.02em", color: "var(--can-ink)" }}>Inventory</h1>
          <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--can-font-sans)", color: "var(--can-body-muted)" }}>
            Manage what&rsquo;s on the shelf -- add, edit, and track every product you sell.
          </p>
        </div>
        <ProductFormModal
          trigger={
            <button
              type="button"
              className="flex items-center gap-2"
              style={{ border: 0, background: "var(--can-gradient-accent)", color: "#fff", cursor: "pointer", font: "600 14px/1 var(--can-font-sans)", borderRadius: 10, padding: "13px 20px", boxShadow: "0 4px 14px rgba(29,78,216,.28)" }}
            >
              <PlusIcon /> Add product
            </button>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-3" style={{ marginTop: 26 }}>
        <StatTile label="Products" value={String(products.length)} icon={<BoxIcon />} sub="in your catalog" />
        <StatTile label="Units on hand" value={String(totalUnits)} icon={<BoxIcon />} sub="across all products" />
        <StatTile label="Stock value" value={formatMoneyDetail(totalValuePaise)} icon={<WalletIcon />} sub="at listed price" />
      </div>

      {lowStock.length > 0 && (
        <div
          style={{
            marginTop: 18,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 20px",
            borderRadius: "var(--can-radius-card)",
            border: "1px solid var(--can-amber)",
            background: "var(--can-amber-bg)",
            boxShadow: "var(--can-shadow-card)",
          }}
        >
          <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangleIcon />
          </span>
          <div>
            <p style={{ margin: 0, font: "700 14px/1.3 var(--can-font-sans)", color: "var(--can-amber)" }}>
              {lowStock.length} product{lowStock.length === 1 ? "" : "s"} running low on stock
            </p>
            <p style={{ margin: 0, marginTop: 2, font: "500 12.5px/1.4 var(--can-font-sans)", color: "var(--can-amber)" }}>
              {lowStock.map((p) => `${p.name} (${p.quantity} left)`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <Card style={{ marginTop: 24, textAlign: "center", padding: "56px 20px" }}>
          <div style={{ width: 64, height: 64, margin: "0 auto", borderRadius: 18, background: "var(--can-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DefaultProductIcon size={30} />
          </div>
          <p style={{ marginTop: 18, font: "700 16px/1.4 var(--can-font-sans)", color: "var(--can-ink)" }}>Your catalog is empty</p>
          <p style={{ marginTop: 4, font: "400 13.5px/1.4 var(--can-font-sans)", color: "var(--can-tertiary)" }}>
            Add your first product to start selling from the Ledger.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4" style={{ marginTop: 24 }}>
          {products.map((p) => {
            const low = p.quantity <= LOW_STOCK_THRESHOLD;
            const barPct = Math.min(100, Math.round((p.quantity / STOCK_BAR_SCALE) * 100));
            return (
              <Card key={p.id} style={{ padding: 0, overflow: "hidden" }}>
                <div className="can-product-card" style={{ borderRadius: "inherit", overflow: "hidden" }}>
                  <div
                    style={{
                      height: 148,
                      overflow: "hidden",
                      background: p.imageUrl ? "var(--can-panel)" : "linear-gradient(135deg, var(--can-tint) 0%, var(--can-tint-2) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- product photos are already-hosted Supabase Storage URLs, arbitrary count, not worth Next/Image config for this internal counter tool
                      <img src={p.imageUrl} alt={p.name} className="can-product-image" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <DefaultProductIcon size={44} />
                    )}
                    {low && (
                      <span
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          font: "700 10.5px/1 var(--can-font-sans)",
                          letterSpacing: ".03em",
                          color: "#fff",
                          background: "var(--can-red)",
                          borderRadius: "var(--can-radius-pill)",
                          padding: "5px 10px",
                          boxShadow: "0 2px 6px rgba(220,38,38,.35)",
                        }}
                      >
                        LOW STOCK
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "16px 18px" }}>
                    <p style={{ margin: 0, font: "700 15.5px/1.3 var(--can-font-sans)", color: "var(--can-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </p>
                    <p style={{ margin: "4px 0 0", font: "700 22px/1.2 var(--can-font-mono)", color: "var(--can-primary)" }}>{formatMoneyDetail(p.pricePerUnitPaise)}</p>

                    <div style={{ marginTop: 12 }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
                        <span style={{ font: "600 11.5px/1 var(--can-font-sans)", color: "var(--can-tertiary)", textTransform: "uppercase", letterSpacing: ".04em" }}>Stock</span>
                        <span style={{ font: "700 12.5px/1 var(--can-font-mono)", color: low ? "var(--can-red-text)" : "var(--can-body)" }}>{p.quantity} units</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 4, background: "var(--can-divider)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${barPct}%`, borderRadius: 4, background: low ? "var(--can-red)" : "var(--can-primary)", transition: "width .3s ease" }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2" style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--can-divider)" }}>
                      <ProductFormModal
                        product={p}
                        trigger={
                          <button
                            type="button"
                            title="Edit product"
                            className="can-icon-btn flex items-center justify-center gap-1.5"
                            style={{ flex: 1, border: "1px solid var(--can-border)", background: "var(--can-white)", cursor: "pointer", borderRadius: 8, padding: "9px 0", font: "600 12.5px/1 var(--can-font-sans)", color: "var(--can-body)" }}
                          >
                            <EditIcon /> Edit
                          </button>
                        }
                      />
                      <DeleteProductButton productId={p.id} productName={p.name} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
