// Admin's read-only oversight of Sports Faculty operations -- same "summary
// only, never a second operator UI" rule /admin/library follows for Library.
// Teams/training/tournaments/results/achievements/OD requests/equipment
// issue-return are all created and managed on mobile by Sports Faculty; this
// tab only ever renders what GET /sports/overview returns, no create/edit
// forms anywhere in this file.

import { KpiCard } from "@/components/dashboard/KpiCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate } from "@/lib/format";
import type { Coach } from "./CoachesPanel";

export interface SportsOverviewTeam {
  id: string;
  sportName: string;
  name: string;
  coachId: string | null;
  status: string;
}

export interface SportsOverviewTournament {
  id: string;
  sportName: string;
  name: string;
  level: string;
  startDate: string;
  endDate: string;
  state: string;
}

export interface SportsOverviewOdRequest {
  id: string;
  teamName: string;
  sportName: string;
  eventDate: string;
  reason: string;
  state: string;
}

export interface SportsOverviewAchievement {
  id: string;
  studentFirstName: string;
  studentLastName: string;
  teamName: string | null;
  tournamentName: string | null;
  placement: string;
  awardedOn: string;
}

export interface SportsOverviewEquipmentIssue {
  id: string;
  equipmentName: string;
  issuedToStudentId: string | null;
  issuedToTeamId: string | null;
  quantity: number;
  issuedOn: string;
  dueOn: string | null;
  overdue: boolean;
}

export interface SportsOverview {
  totals: {
    teams: number;
    tournaments: number;
    ongoingTournaments: number;
    upcomingFixtures: number;
    pendingOdRequests: number;
    outstandingEquipmentIssues: number;
    overdueEquipmentIssues: number;
  };
  teams: SportsOverviewTeam[];
  tournaments: SportsOverviewTournament[];
  odRequests: SportsOverviewOdRequest[];
  achievements: SportsOverviewAchievement[];
  outstandingEquipmentIssues: SportsOverviewEquipmentIssue[];
}

function teamStatusTone(status: string): "success" | "pending" | "critical" {
  return status === "ACTIVE" ? "success" : "pending";
}

function tournamentStateTone(state: string): "success" | "pending" | "critical" {
  if (state === "ONGOING") return "success";
  if (state === "CANCELLED") return "critical";
  return "pending";
}

function odStateTone(state: string): "success" | "pending" | "critical" {
  if (state === "APPROVED") return "success";
  if (state === "REJECTED" || state === "CANCELLED") return "critical";
  return "pending";
}

export function SportsOversightPanel({ overview, coaches }: { overview: SportsOverview; coaches: Coach[] }) {
  const coachById = new Map(coaches.map((c) => [c.id, c.fullName]));

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[13px] text-text-muted">
        Read-only. Teams, training, tournaments, results, achievements, OD requests and equipment issue/return are
        created and managed on mobile by Sports Faculty — nothing here can be edited.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard eyebrow="Teams" value={String(overview.totals.teams)} detail="Across all sports" icon={<span>🏆</span>} />
        <KpiCard
          eyebrow="Tournaments"
          value={String(overview.totals.tournaments)}
          detail={`${overview.totals.ongoingTournaments} ongoing`}
          icon={<span>📅</span>}
        />
        <KpiCard eyebrow="Upcoming fixtures" value={String(overview.totals.upcomingFixtures)} detail="Scheduled, not yet played" icon={<span>⚽</span>} />
        <KpiCard eyebrow="OD requests" value={String(overview.totals.pendingOdRequests)} detail="Pending Principal decision" icon={<span>📝</span>} />
        <KpiCard
          eyebrow="Equipment out"
          value={String(overview.totals.outstandingEquipmentIssues)}
          detail="Not yet returned"
          icon={<span>🎽</span>}
        />
        <KpiCard eyebrow="Overdue" value={String(overview.totals.overdueEquipmentIssues)} detail="Past due date" icon={<span>⏰</span>} />
      </div>

      <div className="rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Teams</h2>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {overview.teams.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No teams yet.</li>}
          {overview.teams.map((team) => (
            <li key={team.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div>
                <p className="text-[13.5px] font-semibold text-text">{team.name}</p>
                <p className="text-xs text-text-muted">
                  {team.sportName}
                  {team.coachId ? ` · Coach: ${coachById.get(team.coachId) ?? "—"}` : ""}
                </p>
              </div>
              <StatusPill tone={teamStatusTone(team.status)} label={team.status} />
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Tournaments</h2>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {overview.tournaments.length === 0 && (
            <li className="py-6 text-center text-sm text-text-muted">No tournaments yet.</li>
          )}
          {overview.tournaments.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div>
                <p className="text-[13.5px] font-semibold text-text">{t.name}</p>
                <p className="text-xs text-text-muted">
                  {t.sportName} · {t.level} · {formatDate(t.startDate)} – {formatDate(t.endDate)}
                </p>
              </div>
              <StatusPill tone={tournamentStateTone(t.state)} label={t.state} />
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Recent OD requests</h2>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {overview.odRequests.length === 0 && (
              <li className="py-6 text-center text-sm text-text-muted">No OD requests yet.</li>
            )}
            {overview.odRequests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-text">{r.teamName}</p>
                  <p className="truncate text-xs text-text-muted">
                    {r.sportName} · {formatDate(r.eventDate)} · {r.reason}
                  </p>
                </div>
                <StatusPill tone={odStateTone(r.state)} label={r.state} />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Recent achievements</h2>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {overview.achievements.length === 0 && (
              <li className="py-6 text-center text-sm text-text-muted">No achievements recorded yet.</li>
            )}
            {overview.achievements.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-text">
                    {a.studentFirstName} {a.studentLastName}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {a.placement} · {a.teamName ?? a.tournamentName ?? "—"} · {formatDate(a.awardedOn)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-[16px] border border-border bg-surface p-[18px]">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Equipment out</h2>
        <ul className="mt-3 flex flex-col divide-y divide-border">
          {overview.outstandingEquipmentIssues.length === 0 && (
            <li className="py-6 text-center text-sm text-text-muted">Nothing currently issued.</li>
          )}
          {overview.outstandingEquipmentIssues.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div>
                <p className="text-[13.5px] font-semibold text-text">
                  {i.equipmentName} <span className="font-mono text-text-muted">×{i.quantity}</span>
                </p>
                <p className="text-xs text-text-muted">
                  Issued {formatDate(i.issuedOn)}
                  {i.dueOn ? ` · Due ${formatDate(i.dueOn)}` : ""}
                  {i.issuedToTeamId ? " · to a team" : i.issuedToStudentId ? " · to a student" : ""}
                </p>
              </div>
              {i.overdue && <StatusPill tone="critical" label="OVERDUE" />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
