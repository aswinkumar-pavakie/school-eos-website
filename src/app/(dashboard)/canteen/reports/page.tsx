// Canteen Reports -- empathizing as the vendor running this counter: the
// real questions worth reviewing over a period are (1) how much did I
// sell and how many students bought (2) what actually sells, so I know
// what to keep stocking (3) which classes are my real customers (4) how
// many students tried to buy and couldn't (a lost sale, worth knowing)
// (5) what's low on the shelf right now and (6) what my whole stockroom
// is worth right now. Every number here is CanteenService.getReports()'s
// own real aggregate for the chosen range -- nothing fabricated, nothing
// cached. "Download PDF" builds and saves a real PDF file entirely
// client-side (DownloadReportButton, jsPDF) -- one click, no page
// navigation, the file lands straight in the browser's own Downloads
// folder from the exact data already on screen.

import { getCanteenReports } from "@/lib/canteen-api";
import { formatMoneyDetail } from "@/lib/format";
import { Card, StatTile } from "@/components/canteen-ui/primitives";
import { RangeSalesChart, GradeBreakdownDonut } from "@/components/canteen-ui/charts";
import { WalletIcon, ReceiptIcon, PeopleIcon, TrendIcon } from "@/components/canteen-ui/icons";
import { DownloadReportButton } from "./DownloadReportButton";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export default async function CanteenReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const params = await searchParams;
  const to = params.to ?? todayIso();
  const from = params.from ?? daysAgoIso(29);
  const data = await getCanteenReports(from, to);
  const rangeLabel = `${new Date(from).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(to).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 style={{ margin: 0, font: "700 36px/1.1 var(--can-font-sans)", letterSpacing: "-.02em", color: "var(--can-ink)" }}>Reports</h1>
          <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--can-font-sans)", color: "var(--can-body-muted)" }}>
            {new Date(from).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} &ndash; {new Date(to).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <form className="flex items-center gap-2" style={{ font: "500 12.5px/1 var(--can-font-sans)", color: "var(--can-tertiary)" }}>
            <label className="flex items-center gap-2">
              From
              <input type="date" name="from" defaultValue={from} style={{ border: "1px solid var(--can-border)", borderRadius: 8, padding: "8px 10px", font: "400 13px/1 var(--can-font-sans)" }} />
            </label>
            <label className="flex items-center gap-2">
              To
              <input type="date" name="to" defaultValue={to} style={{ border: "1px solid var(--can-border)", borderRadius: 8, padding: "8px 10px", font: "400 13px/1 var(--can-font-sans)" }} />
            </label>
            <button type="submit" style={{ border: 0, background: "var(--can-navy)", color: "#fff", cursor: "pointer", font: "600 12.5px/1 var(--can-font-sans)", borderRadius: 8, padding: "9px 14px" }}>
              Apply
            </button>
          </form>
          <DownloadReportButton data={data} rangeLabel={rangeLabel} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4" style={{ marginTop: 26 }}>
        <StatTile label="Total sales" value={formatMoneyDetail(data.salesPaise)} icon={<WalletIcon />} />
        <StatTile label="Transactions" value={String(data.transactionCount)} icon={<ReceiptIcon />} />
        <StatTile label="Unique students" value={String(data.uniqueStudents)} icon={<PeopleIcon />} />
        <StatTile label="Avg. transaction" value={formatMoneyDetail(data.avgTransactionPaise)} icon={<TrendIcon />} sub={`${data.declinedCount} declined attempt${data.declinedCount === 1 ? "" : "s"}`} />
      </div>

      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-2" style={{ marginTop: 18 }}>
        <Card>
          <h2 style={{ font: "700 15px/1.2 var(--can-font-sans)", color: "var(--can-ink)", margin: 0 }}>Sales trend</h2>
          <p style={{ marginTop: 2, font: "500 12px/1.4 var(--can-font-sans)", color: "var(--can-tertiary)" }}>Day by day across the selected range</p>
          <div style={{ marginTop: 12 }}>
            <RangeSalesChart data={data.dailyTrend} />
          </div>
        </Card>
        <Card>
          <h2 style={{ font: "700 15px/1.2 var(--can-font-sans)", color: "var(--can-ink)", margin: 0 }}>Sales by class</h2>
          <p style={{ marginTop: 2, font: "500 12px/1.4 var(--can-font-sans)", color: "var(--can-tertiary)" }}>Who your real customers are this period</p>
          <div style={{ marginTop: 16 }}>
            <GradeBreakdownDonut data={data.gradeBreakdown} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-2" style={{ marginTop: 18 }}>
        <Card>
          <h2 style={{ font: "700 15px/1.2 var(--can-font-sans)", color: "var(--can-ink)", margin: 0 }}>Top-selling products</h2>
          <p style={{ marginTop: 2, font: "500 12px/1.4 var(--can-font-sans)", color: "var(--can-tertiary)" }}>By revenue, this period -- what to keep stocking</p>
          <div style={{ marginTop: 14 }}>
            {data.topProducts.length === 0 ? (
              <p style={{ font: "400 13.5px/1.5 var(--can-font-sans)", color: "var(--can-tertiary)" }}>No sales recorded in this range.</p>
            ) : (
              data.topProducts.map((p, i) => {
                const maxRevenue = data.topProducts[0]?.revenuePaise || 1;
                return (
                  <div key={p.productName} style={{ padding: "9px 0" }}>
                    <div className="flex items-center justify-between gap-3">
                      <span style={{ font: "600 13.5px/1.3 var(--can-font-sans)", color: "var(--can-ink)" }}>
                        {i + 1}. {p.productName} <span style={{ color: "var(--can-tertiary)", fontWeight: 400 }}>× {p.quantitySold}</span>
                      </span>
                      <span style={{ font: "700 13px/1 var(--can-font-mono)", color: "var(--can-primary)", flexShrink: 0 }}>{formatMoneyDetail(p.revenuePaise)}</span>
                    </div>
                    <span style={{ display: "block", height: 6, borderRadius: 4, background: "var(--can-divider)", marginTop: 6, overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", borderRadius: 4, background: "var(--can-primary)", width: `${(p.revenuePaise / maxRevenue) * 100}%` }} />
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card>
          <h2 style={{ font: "700 15px/1.2 var(--can-font-sans)", color: "var(--can-ink)", margin: 0 }}>Inventory snapshot</h2>
          <p style={{ marginTop: 2, font: "500 12px/1.4 var(--can-font-sans)", color: "var(--can-tertiary)" }}>Right now -- not date-ranged</p>
          <div className="grid grid-cols-2 gap-[14px]" style={{ marginTop: 16 }}>
            <div>
              <p style={{ margin: 0, font: "500 12px/1 var(--can-font-sans)", color: "var(--can-tertiary)" }}>Stock value</p>
              <p style={{ margin: "6px 0 0", font: "700 22px/1.2 var(--can-font-sans)", color: "var(--can-ink)" }}>{formatMoneyDetail(data.inventory.totalValuePaise)}</p>
            </div>
            <div>
              <p style={{ margin: 0, font: "500 12px/1 var(--can-font-sans)", color: "var(--can-tertiary)" }}>Units on hand</p>
              <p style={{ margin: "6px 0 0", font: "700 22px/1.2 var(--can-font-sans)", color: "var(--can-ink)" }}>{data.inventory.totalUnits}</p>
            </div>
            <div>
              <p style={{ margin: 0, font: "500 12px/1 var(--can-font-sans)", color: "var(--can-tertiary)" }}>Products</p>
              <p style={{ margin: "6px 0 0", font: "700 22px/1.2 var(--can-font-sans)", color: "var(--can-ink)" }}>{data.inventory.productCount}</p>
            </div>
            <div>
              <p style={{ margin: 0, font: "500 12px/1 var(--can-font-sans)", color: "var(--can-tertiary)" }}>Low stock</p>
              <p style={{ margin: "6px 0 0", font: "700 22px/1.2 var(--can-font-sans)", color: data.lowStockProducts.length > 0 ? "var(--can-red-text)" : "var(--can-ink)" }}>
                {data.lowStockProducts.length}
              </p>
            </div>
          </div>
          {data.lowStockProducts.length > 0 && (
            <p style={{ marginTop: 14, font: "400 12.5px/1.5 var(--can-font-sans)", color: "var(--can-body-muted)" }}>
              Running low: {data.lowStockProducts.map((p) => `${p.name} (${p.quantity})`).join(", ")}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
