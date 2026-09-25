// Dashboard -- Design Architecture v0.1 module 01: "Answer 'what needs me today'
// in five seconds, then get out of the way." Every figure on this page comes from
// the real backend (GET /admin/dashboard-summary) -- nothing here is placeholder
// data. Metrics that depend on modules not yet built (fee collection, canteen,
// NFC) are named as coming later rather than faked.

import Link from "next/link";
import {
  AttendanceIcon,
  FacultyIcon,
  HostelIcon,
  ParentsIcon,
  StudentsIcon,
  SubjectMappingIcon,
  TransportIcon,
} from "@/components/dashboard/icons";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { CreateAnnouncementForm } from "@/components/announcements/CreateAnnouncementForm";
import { apiFetch } from "@/lib/api";
import { listApprovals } from "@/lib/finance-api";
import { getPrincipalDashboardSummary } from "@/lib/principal-api";
import { formatCount, formatPercentOf, formatRelativeTime, percentOf } from "@/lib/format";

interface AnnouncementRow {
  id: string;
  title: string;
  category: string | null;
  createdAt: string;
}

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
  const [res, personRes, pendingApprovals, announcementsRes, principalSummary] = await Promise.all([
    apiFetch("/admin/dashboard-summary"),
    apiFetch("/auth/me"),
    listApprovals({ status: "PENDING" }).catch(() => []),
    apiFetch("/announcements?limit=4"),
    // Same real leadership-summary endpoint Principal's own dashboard uses
    // (widened to ADMIN too) -- it already computes parentLoginsIssued and
    // staffMarkedToday, two real KPIs the reference design wants that
    // /admin/dashboard-summary doesn't have, without duplicating the
    // aggregation. `.catch()` so a transient failure just drops those two
    // tiles' extra detail rather than breaking the whole dashboard.
    getPrincipalDashboardSummary().catch(() => null),
  ]);

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
  const person = personRes.ok
    ? ((await personRes.json()) as { data: { person: { firstName: string } } }).data.person
    : null;
  const notices: AnnouncementRow[] = announcementsRes.ok
    ? ((await announcementsRes.json()) as { data: AnnouncementRow[] }).data.slice(0, 4)
    : [];

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {/* --eos-h1: 28/34 · 700 */}
          <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">
            {greeting()}
            {person ? `, ${person.firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            School overview · admin console ·{" "}
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs font-semibold text-text-muted">
            Updated {formatRelativeTime(summary.generatedAt)}
          </span>
          {pendingApprovals.length > 0 && (
            <Link
              href="/admin/requests"
              className="rounded-[var(--radius-pill)] border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary-deep"
            >
              ⚠ {pendingApprovals.length} request{pendingApprovals.length === 1 ? "" : "s"} awaiting your decision
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          eyebrow="Active students"
          value={String(summary.activeStudents)}
          detail={[
            `Across ${principalSummary?.activeSectionsCount ?? summary.sectionsCount} active sections`,
            principalSummary
              ? `${principalSummary.studentResidence.hostellers} hostellers · ${principalSummary.studentResidence.dayScholars} day scholars`
              : "",
          ].filter(Boolean)}
          icon={<StudentsIcon className="h-5 w-5" />}
          href="/admin/students"
        />
        <KpiCard
          eyebrow="Faculty & staff on roll"
          value={String(summary.activeStaff)}
          detail={[
            principalSummary
              ? `${principalSummary.staffSplit.teaching} teaching · ${principalSummary.staffSplit.support} support`
              : `${summary.subjectsCount} active subjects`,
          ]}
          icon={<FacultyIcon className="h-5 w-5" />}
          href="/admin/faculty"
        />
        <KpiCard
          eyebrow="Parent logins issued"
          value={principalSummary ? String(principalSummary.parentLoginsIssued.issued) : "—"}
          detail={
            principalSummary
              ? `${principalSummary.parentLoginsIssued.totalFamilies - principalSummary.parentLoginsIssued.issued} yet to activate`
              : "Not available right now"
          }
          bar={principalSummary ? percentOf(principalSummary.parentLoginsIssued.issued, principalSummary.parentLoginsIssued.totalFamilies) : undefined}
          icon={<ParentsIcon className="h-5 w-5" />}
          href="/admin/parents"
        />
        <KpiCard
          eyebrow="Hostel occupancy"
          value={formatPercentOf(summary.hostelOccupancy.occupiedBeds, summary.hostelOccupancy.totalBeds)}
          detail={`${formatCount(summary.hostelOccupancy.occupiedBeds, summary.hostelOccupancy.totalBeds)} beds occupied`}
          bar={percentOf(summary.hostelOccupancy.occupiedBeds, summary.hostelOccupancy.totalBeds)}
          icon={<HostelIcon className="h-5 w-5" />}
          href="/admin/hostel"
        />
        <KpiCard
          eyebrow="Transport fleet"
          value={String(summary.vehiclesCount)}
          detail="Vehicles registered"
          icon={<TransportIcon className="h-5 w-5" />}
          href="/admin/transport"
        />
        <KpiCard
          eyebrow="Subjects offered"
          value={String(summary.subjectsCount)}
          detail="Core, language and elective"
          icon={<SubjectMappingIcon className="h-5 w-5" />}
          href="/admin/academics/subjects-mapping"
        />
        <KpiCard
          eyebrow="Staff marked today"
          value={
            principalSummary
              ? `${principalSummary.staffMarkedToday.present} / ${principalSummary.staffMarkedToday.total}`
              : "—"
          }
          detail={
            principalSummary
              ? `${principalSummary.staffMarkedToday.present} present · ${principalSummary.staffMarkedToday.absent} absent · ${principalSummary.staffMarkedToday.onLeave} on leave`
              : "Not available right now"
          }
          bar={principalSummary ? percentOf(principalSummary.staffMarkedToday.present, principalSummary.staffMarkedToday.total) : undefined}
          icon={<AttendanceIcon className="h-5 w-5" />}
          href="/admin/attendance"
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
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Needs attention</h2>
              <span className="rounded-[var(--radius-pill)] bg-field px-2.5 py-1 text-xs font-bold text-text-muted">
                {summary.actionItems.reduce((sum, i) => sum + i.count, 0)}
              </span>
            </div>
            <ul className="mt-3 flex flex-col divide-y divide-border">
              {summary.actionItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="flex items-center justify-between gap-3 py-3 text-[14px] font-semibold text-text transition-colors hover:text-primary"
                  >
                    <span>{item.label}</span>
                    <span
                      className="shrink-0 rounded-[10px] px-3 py-1.5 font-mono text-[13px] font-bold"
                      style={{
                        color: "var(--color-primary-deep)",
                        background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                      }}
                    >
                      {item.count}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[16px] border border-border bg-surface p-[18px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Notices</h2>
              <CreateAnnouncementForm
                revalidatePathOverride="/admin"
                triggerLabel="New"
                triggerClassName="rounded-[8px] bg-primary-deep px-4 py-2 text-[13px] font-bold text-white"
              />
            </div>
            {notices.length === 0 ? (
              <p className="mt-3 text-sm text-text-muted">No notices published yet.</p>
            ) : (
              <ul className="mt-2 flex flex-col divide-y divide-border">
                {notices.map((n) => (
                  <li key={n.id} className="py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-[6px] bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                        {n.category ?? "General"}
                      </span>
                      <span className="text-xs text-text-muted">{formatRelativeTime(n.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-bold text-text">{n.title}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Coming in a later phase</h2>
        <p className="mt-1 text-[13px] text-text-muted">
          These need modules that aren&apos;t built yet, so they&apos;re left out rather
          than shown with placeholder numbers.
        </p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {[
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
  );
}
