// Correspondent -> Governance Insights (Phase 9B). Not a new aggregation
// engine -- reuses the exact same real GET /admin/reports-summary data the
// existing /correspondent/reports page already renders as charts (already
// grants CORRESPONDENT). This page adds only explanatory, factual framing on
// top of numbers that already exist, plus links back to the real underlying
// module (Reports, Action Center, Compliance, Requests & approvals) rather
// than re-deriving or duplicating any of that data. Every statement here is
// deterministic arithmetic over real counts (ratios, a first-half/second-half
// average comparison of the existing 30-day daily attendance series) -- no
// prediction, no score, no AI.

import Link from "next/link";
import { AuthExpiredError } from "@/lib/api";
import { formatMoneySummary } from "@/lib/format";
import { getReportsSummary, type ReportsSummary } from "@/lib/reports-api";
import { redirect } from "next/navigation";

function InsightCard({
  title,
  fact,
  detail,
  href,
  linkLabel,
}: {
  title: string;
  fact: string;
  detail?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="rounded-[16px] border border-border bg-surface p-[18px]">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.06em] text-text-muted">{title}</h2>
      <p className="mt-2 text-[16px] font-semibold leading-snug text-text">{fact}</p>
      {detail && <p className="mt-1.5 text-[13px] text-text-muted">{detail}</p>}
      {href && (
        <Link href={href} className="mt-3 inline-block text-[13px] font-semibold text-primary">
          {linkLabel ?? "View underlying records"} →
        </Link>
      )}
    </div>
  );
}

function sum(items: { count: number }[]): number {
  return items.reduce((s, i) => s + i.count, 0);
}
function countFor(items: { state?: string; status?: string; count: number }[], value: string): number {
  return items.find((i) => (i.state ?? i.status) === value)?.count ?? 0;
}

export default async function CorrespondentGovernancePage() {
  let data: ReportsSummary;
  try {
    data = await getReportsSummary();
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Governance Insights</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  // Attendance: real first-half vs second-half average of the same 30-day
  // series the Reports line chart already plots -- a factual comparison, not
  // a forecast.
  const series = data.attendance.dailyPercentPresent;
  const mid = Math.floor(series.length / 2);
  const firstHalf = series.slice(0, mid);
  const secondHalf = series.slice(mid);
  const avg = (arr: { percentPresent: number }[]) =>
    arr.length > 0 ? Math.round(arr.reduce((s, a) => s + a.percentPresent, 0) / arr.length) : null;
  const firstAvg = avg(firstHalf);
  const secondAvg = avg(secondHalf);

  const requestsTotal = sum(data.requestsApprovals.byState);
  const requestsPending = countFor(data.requestsApprovals.byState, "PENDING");

  const inventoryTotal = sum(data.inventory.byStatus);
  const inventoryDamaged = countFor(data.inventory.byStatus, "DAMAGED");
  const inventoryLost = countFor(data.inventory.byStatus, "LOST");

  const vehiclesTotal = sum(data.transport.vehiclesByStatus);
  const vehiclesActive = countFor(data.transport.vehiclesByStatus, "ACTIVE");

  const hostelTotalBeds = data.hostel.occupancyByHostel.reduce((s, h) => s + h.occupied + h.vacant, 0);
  const hostelOccupied = data.hostel.occupancyByHostel.reduce((s, h) => s + h.occupied, 0);

  const libraryTotal = sum(data.library.byStatus);
  const libraryOverdue = countFor(
    data.library.byStatus.map((l) => ({ state: l.status, count: l.count })),
    "OVERDUE",
  );

  return (
    <div className="mx-auto max-w-[1180px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Governance Insights</h1>
      <p className="mt-1 text-sm text-text-muted">
        Factual, aggregated patterns from real institution-wide data — the same figures{" "}
        <Link href="/correspondent/reports" className="font-semibold text-primary">
          Reports &amp; Analytics
        </Link>{" "}
        already shows, framed for school-level attention. No predictions, no scores — every statement links back to
        its source.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        <InsightCard
          title="Attendance trend"
          fact={
            firstAvg !== null && secondAvg !== null
              ? secondAvg === firstAvg
                ? `Daily attendance held steady around ${secondAvg}% over the last 30 days.`
                : secondAvg > firstAvg
                  ? `Daily attendance improved from ~${firstAvg}% to ~${secondAvg}% over the last 30 days.`
                  : `Daily attendance declined from ~${firstAvg}% to ~${secondAvg}% over the last 30 days.`
              : "Not enough attendance sessions recorded yet to compare."
          }
          detail={`First 15 days avg ${firstAvg ?? "—"}% · last 15 days avg ${secondAvg ?? "—"}%`}
          href="/correspondent/students/attention"
          linkLabel="View student attendance"
        />

        <InsightCard
          title="Requests & approvals"
          fact={
            requestsTotal > 0
              ? `${requestsPending} of ${requestsTotal} requests (${Math.round((requestsPending / requestsTotal) * 100)}%) are still pending a decision.`
              : "No requests raised yet."
          }
          href="/correspondent/requests"
          linkLabel="View Requests & approvals"
        />

        <InsightCard
          title="Inventory condition"
          fact={
            inventoryTotal > 0
              ? `${inventoryDamaged + inventoryLost} of ${inventoryTotal} tracked items (${Math.round(((inventoryDamaged + inventoryLost) / inventoryTotal) * 100)}%) are damaged or lost.`
              : "No inventory items recorded yet."
          }
          detail={`${inventoryDamaged} damaged · ${inventoryLost} lost`}
          href="/correspondent/actions"
          linkLabel="View Action Center"
        />

        <InsightCard
          title="Fleet availability"
          fact={
            vehiclesTotal > 0
              ? `${vehiclesActive} of ${vehiclesTotal} vehicles (${Math.round((vehiclesActive / vehiclesTotal) * 100)}%) are currently active.`
              : "No vehicles registered yet."
          }
          href="/correspondent/transport"
          linkLabel="View Transport"
        />

        <InsightCard
          title="Hostel occupancy"
          fact={
            hostelTotalBeds > 0
              ? `${hostelOccupied} of ${hostelTotalBeds} beds (${Math.round((hostelOccupied / hostelTotalBeds) * 100)}%) are occupied.`
              : "No hostel beds configured yet."
          }
          href="/correspondent/hostel"
          linkLabel="View Hostel"
        />

        <InsightCard
          title="Library circulation"
          fact={
            libraryTotal > 0
              ? `${libraryOverdue} of ${libraryTotal} tracked copies (${Math.round((libraryOverdue / libraryTotal) * 100)}%) are overdue.`
              : "No book copies catalogued yet."
          }
          href="/correspondent/library"
          linkLabel="View Library"
        />

        <InsightCard
          title="Fee collection"
          fact={`${formatMoneySummary(data.fees.totalOutstandingPaise)} outstanding across pending, partial and overdue instalments.`}
          href="/correspondent/finance/overview"
          linkLabel="View Finance overview"
        />
      </div>
    </div>
  );
}
