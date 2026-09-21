// Canteen counter's Dashboard -- the module's real landing page now (Ledger
// moved to its own /canteen/ledger route). Every number and chart here is a
// real aggregate straight off canteen_transaction as of page load
// (CanteenService.getDashboard(), see its own header comment) -- nothing
// cached, nothing fabricated. Header/stat-grid pixel-matched value-for-value
// to src/app/(dashboard)/faculty/page.tsx's own greeting+stat-tile block
// (same H1/subtitle sizes, same grid gap/breakpoints, same button styling),
// per explicit instruction: "same color same font same size text style
// text size color etc design exactly same... 100 percent... like others".

import Link from "next/link";
import { getCanteenDashboard } from "@/lib/canteen-api";
import { apiFetch } from "@/lib/api";
import { formatMoneyDetail } from "@/lib/format";
import { Card, StatTile } from "@/components/canteen-ui/primitives";
import { PeopleIcon, ReceiptIcon, TrendIcon, WalletIcon } from "@/components/canteen-ui/icons";
import { WeeklySalesChart, HourlySalesChart, GradeBreakdownDonut, hourLabel } from "@/components/canteen-ui/charts";

interface MeResponse {
  data: { person: { firstName: string; lastName: string | null } };
}

// A page.tsx can't receive props from its own layout.tsx in the App Router
// (layout only ever passes `children`) -- CanteenLayout already fetches
// /auth/me for the sidebar's name; this is the same small fetch repeated
// here for the greeting, same as Faculty's own dashboard page.tsx does
// independently of FacultyShell/layout.tsx.
async function getPersonFirstName(): Promise<string> {
  const res = await apiFetch("/auth/me");
  if (!res.ok) return "";
  const body = (await res.json()) as MeResponse;
  return body.data.person.firstName;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default async function CanteenDashboardPage() {
  const [data, personName] = await Promise.all([getCanteenDashboard(), getPersonFirstName()]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 style={{ font: "700 38px/1.1 var(--can-font-sans)", letterSpacing: "-.02em", color: "var(--can-ink)" }}>
            {greeting()}
            {personName ? `, ${personName}` : ""}
          </h1>
          <p style={{ font: "400 15px/1.4 var(--can-font-sans)", color: "var(--can-body-muted)", margin: "9px 0 0" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/canteen/history"
            className="can-hover-lift"
            style={{ border: "1px solid var(--can-border)", background: "var(--can-white)", font: "600 14px/1 var(--can-font-sans)", color: "var(--can-navy)", borderRadius: 9, padding: "12px 18px", display: "inline-block" }}
          >
            View history
          </Link>
          <Link
            href="/canteen/ledger"
            style={{ border: 0, background: "var(--can-primary)", color: "#fff", font: "600 14px/1 var(--can-font-sans)", borderRadius: 9, padding: "12px 18px", display: "inline-block" }}
          >
            New charge
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4" style={{ marginTop: 26 }}>
        <StatTile label="Today's sales" value={formatMoneyDetail(data.todaySalesPaise)} icon={<WalletIcon />} deltaPct={data.salesDeltaPct} />
        <StatTile label="Transactions today" value={String(data.todayTransactionCount)} icon={<ReceiptIcon />} deltaPct={data.transactionsDeltaPct} />
        <StatTile label="Students served" value={String(data.todayUniqueStudents)} icon={<PeopleIcon />} sub="unique today" />
        <StatTile label="Avg. transaction" value={formatMoneyDetail(data.todayAvgTransactionPaise)} icon={<TrendIcon />} />
      </div>

      {data.declinedToday > 0 && (
        <div
          style={{
            marginTop: 18,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 20px",
            borderRadius: "var(--can-radius-card)",
            border: "1px solid #fde68a",
            background: "#fffbeb",
          }}
        >
          <span style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", font: "700 15px/1 var(--can-font-sans)", color: "#b45309" }}>
            !
          </span>
          <div>
            <p style={{ margin: 0, font: "700 14px/1.3 var(--can-font-sans)", color: "#92400e" }}>
              {data.declinedToday} charge attempt{data.declinedToday === 1 ? "" : "s"} declined today
            </p>
            <p style={{ margin: 0, marginTop: 1, font: "400 12.5px/1.4 var(--can-font-sans)", color: "#a16207" }}>
              Insufficient balance or a frozen wallet -- nothing was charged for these.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-2" style={{ marginTop: 18 }}>
        <Card>
          <h2 style={{ font: "700 15px/1.2 var(--can-font-sans)", color: "var(--can-ink)", margin: 0 }}>Sales this week</h2>
          <p style={{ marginTop: 2, font: "500 12px/1.4 var(--can-font-sans)", color: "var(--can-tertiary)" }}>Last 7 days &middot; today highlighted</p>
          <div style={{ marginTop: 12 }}>
            <WeeklySalesChart data={data.weeklyTrend} />
          </div>
        </Card>
        <Card>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div>
              <h2 style={{ font: "700 15px/1.2 var(--can-font-sans)", color: "var(--can-ink)", margin: 0 }}>Sales by hour</h2>
              <p style={{ marginTop: 2, font: "500 12px/1.4 var(--can-font-sans)", color: "var(--can-tertiary)" }}>Today, 7am&ndash;7pm</p>
            </div>
            {data.peakHour !== null && (
              <span style={{ font: "700 11.5px/1 var(--can-font-sans)", color: "#b45309", background: "#fef3c7", borderRadius: "var(--can-radius-pill)", padding: "5px 10px", whiteSpace: "nowrap" }}>
                Busiest {hourLabel(data.peakHour)}
              </span>
            )}
          </div>
          <div style={{ marginTop: 12 }}>
            <HourlySalesChart data={data.hourlyToday} peakHour={data.peakHour} />
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 18 }}>
        <h2 style={{ font: "700 15px/1.2 var(--can-font-sans)", color: "var(--can-ink)", margin: 0 }}>Sales by class</h2>
        <p style={{ marginTop: 2, font: "500 12px/1.4 var(--can-font-sans)", color: "var(--can-tertiary)" }}>Today &middot; what to stock more of</p>
        <div style={{ marginTop: 16 }}>
          <GradeBreakdownDonut data={data.gradeBreakdown} />
        </div>
      </Card>

      <Card style={{ marginTop: 18, padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid var(--can-divider)" }}>
          <h2 style={{ font: "700 15px/1.2 var(--can-font-sans)", color: "var(--can-ink)", margin: 0 }}>Recent transactions</h2>
          <Link href="/canteen/history" style={{ font: "600 12.5px/1 var(--can-font-sans)", color: "var(--can-primary)", textDecoration: "none" }}>
            View all
          </Link>
        </div>
        {data.recentTransactions.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", font: "500 13.5px/1.4 var(--can-font-sans)", color: "var(--can-tertiary)" }}>
            No canteen charges yet today.
          </div>
        ) : (
          <div>
            {data.recentTransactions.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 20px", borderBottom: "1px solid var(--can-divider)" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, font: "600 14px/1.3 var(--can-font-sans)", color: "var(--can-ink)" }}>{t.studentName}</p>
                  <p style={{ margin: 0, marginTop: 2, font: "500 12px/1.3 var(--can-font-mono)", color: "var(--can-tertiary)" }}>
                    {t.admissionNo}
                    {t.gradeName ? ` · ${t.gradeName}${t.sectionName ? `-${t.sectionName}` : ""}` : ""}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, font: "700 14px/1.3 var(--can-font-sans)", color: "var(--can-red)" }}>-{formatMoneyDetail(t.amountPaise)}</p>
                  <p style={{ margin: 0, marginTop: 2, font: "500 11.5px/1.3 var(--can-font-sans)", color: "var(--can-tertiary)" }}>{timeAgo(t.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
