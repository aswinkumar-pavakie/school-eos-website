// Dashboard -- Design Architecture v0.1 module 01: "Answer 'what needs me today'
// in five seconds, then get out of the way." Every figure on this page comes from
// the real backend (GET /admin/dashboard-summary) -- nothing here is placeholder
// data. Metrics that depend on modules not yet built (fee collection, canteen,
// NFC) are named as coming later rather than faked.

import {
  AcademicsIcon,
  HostelIcon,
  IdCardIcon,
  ParentsIcon,
  SportsIcon,
  StudentsIcon,
  TransportIcon,
} from "@/components/dashboard/icons";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { apiFetch } from "@/lib/api";
import { formatCount, formatDate, formatPercent, formatRelativeTime } from "@/lib/format";

interface DashboardSummary {
  activeStudents: number;
  activeStaff: number;
  currentAcademicYear: { id: string; name: string; startDate: string; endDate: string } | null;
  hostelOccupancy: { occupiedBeds: number; totalBeds: number };
  sectionsCount: number;
  subjectsCount: number;
  vehiclesCount: number;
  activeRoutesCount: number;
  activeSportsCount: number;
  idCardsIssuedCount: number;
  actionItems: { label: string; count: number; href: string }[];
  recentActivity: {
    id: string;
    action: string;
    objectType: string;
    outcome: "SUCCESS" | "DENIED" | "ERROR";
    occurredAt: string;
    actorName: string | null;
    detail: string | null;
  }[];
  generatedAt: string;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function prettifyAction(action: string): string {
  const words = action.toLowerCase().split("_");
  return words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
}

function outcomeTone(outcome: string): "success" | "pending" | "critical" {
  if (outcome === "SUCCESS") return "success";
  if (outcome === "ERROR") return "critical";
  return "critical";
}

export default async function DashboardHomePage() {
  const res = await apiFetch("/admin/dashboard-summary");

  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load the dashboard</p>
        <p className="mt-1.5 text-sm text-text-muted">
          Nothing was changed — try refreshing the page.
        </p>
      </div>
    );
  }

  const { data: summary } = (await res.json()) as { data: DashboardSummary };
  const personRes = await apiFetch("/auth/me");
  const person = personRes.ok
    ? ((await personRes.json()) as { data: { person: { firstName: string } } }).data.person
    : null;

  const yearLabel = summary.currentAcademicYear
    ? `${summary.currentAcademicYear.name}`
    : "No current year set";
  const yearDetail = summary.currentAcademicYear
    ? `${formatDate(summary.currentAcademicYear.startDate)} – ${formatDate(summary.currentAcademicYear.endDate)}`
    : "Set one in Academics";

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {/* --eos-h1: 28/34 · 700 */}
          <h1 className="text-[28px] font-bold leading-[34px] text-text">
            {greeting()}
            {person ? `, ${person.firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-text-muted">Institution overview · Admin Console</p>
        </div>
        <p className="text-xs text-text-muted">
          Updated {formatRelativeTime(summary.generatedAt)}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[22px] sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          eyebrow="Active students"
          value={String(summary.activeStudents)}
          detail={`Across ${summary.sectionsCount} active sections`}
          icon={<StudentsIcon className="h-5 w-5" />}
          href="/admin/students"
        />
        <KpiCard
          eyebrow="Faculty & staff on roll"
          value={String(summary.activeStaff)}
          detail={`${summary.subjectsCount} active subjects`}
          icon={<ParentsIcon className="h-5 w-5" />}
          href="/admin/faculty"
        />
        <KpiCard
          eyebrow="Hostel occupancy"
          value={formatPercent(summary.hostelOccupancy.occupiedBeds, summary.hostelOccupancy.totalBeds)}
          detail={`${formatCount(summary.hostelOccupancy.occupiedBeds, summary.hostelOccupancy.totalBeds)} beds occupied`}
          icon={<HostelIcon className="h-5 w-5" />}
          href="/admin/hostel"
        />
        <KpiCard
          eyebrow="Academic year"
          value={yearLabel}
          detail={yearDetail}
          icon={<AcademicsIcon className="h-5 w-5" />}
          href="/admin/academics"
        />
      </div>

      <div className="mt-[22px] grid grid-cols-1 gap-[22px] sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          eyebrow="Transport fleet"
          value={String(summary.vehiclesCount)}
          detail="Vehicles registered"
          icon={<TransportIcon className="h-5 w-5" />}
          href="/admin/transport"
        />
        <KpiCard
          eyebrow="Active routes"
          value={String(summary.activeRoutesCount)}
          detail="Pickup, drop and both-way routes"
          icon={<TransportIcon className="h-5 w-5" />}
          href="/admin/transport?tab=routes"
        />
        <KpiCard
          eyebrow="Sports offered"
          value={String(summary.activeSportsCount)}
          detail="Individual and team sports"
          icon={<SportsIcon className="h-5 w-5" />}
          href="/admin/sports"
        />
        <KpiCard
          eyebrow="ID cards issued"
          value={String(summary.idCardsIssuedCount)}
          detail="Active student & staff cards"
          icon={<IdCardIcon className="h-5 w-5" />}
          href="/admin/students"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-[16px] border border-border bg-surface p-[18px] lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Recent administrative activity</h2>
            <a href="/admin/audit" className="text-[13px] font-semibold text-primary">
              View audit trail
            </a>
          </div>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {summary.recentActivity.length === 0 && (
              <li className="py-6 text-center text-sm text-text-muted">No activity recorded yet.</li>
            )}
            {summary.recentActivity.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-text">
                    {prettifyAction(event.action)}
                    {event.detail && <span className="font-normal text-text-muted"> — {event.detail}</span>}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {event.objectType.replace(/_/g, " ")}
                    {event.actorName && ` · ${event.actorName}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusPill
                    tone={outcomeTone(event.outcome)}
                    label={event.outcome.charAt(0) + event.outcome.slice(1).toLowerCase()}
                  />
                  <span className="text-xs text-text-muted">
                    {formatRelativeTime(event.occurredAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[16px] border border-border bg-surface p-[18px]">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Needs attention</h2>
            <ul className="mt-3 flex flex-col divide-y divide-border">
              {summary.actionItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="flex items-center justify-between gap-3 py-2.5 text-[13px] text-text transition-colors hover:text-primary"
                  >
                    <span>{item.label}</span>
                    <span
                      className={`shrink-0 rounded-[7px] px-2 py-0.5 font-mono text-[12.5px] font-semibold ${
                        item.count > 0
                          ? "bg-pending-bg text-pending-text"
                          : "bg-success-bg text-success-text"
                      }`}
                    >
                      {item.count}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[16px] border border-border bg-surface p-[18px]">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Coming in a later phase</h2>
            <p className="mt-1 text-[13px] text-text-muted">
              These need modules that aren&apos;t built yet, so they&apos;re left out rather
              than shown with placeholder numbers.
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {[
                "Fee collection & outstanding — needs Finance operations",
                "Canteen activity — needs the Wallet/Canteen module",
                "NFC / card status — coming in a future update",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[13px] text-text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
