"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { EmptyState, FieldError } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { SportPicker } from "@/components/sports-faculty/SportPicker";
import type { SportsTeam, TeamRosterMember } from "@/lib/sports-faculty-api";
import { addRosterMemberAction, assignCoachAction, createTeamAction, endRosterMemberAction, type FormState } from "./actions";

const initial: FormState = {};

export function TeamsPanel({
  teams,
  rostersByTeam,
  knownSports,
}: {
  teams: SportsTeam[];
  rostersByTeam: Record<string, TeamRosterMember[]>;
  knownSports: { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CreateTeamModal knownSports={knownSports} />
      </div>

      {teams.length === 0 ? (
        <EmptyState title="No teams yet" body="Create your first team for a sport you're the In-Charge for." />
      ) : (
        <div className="flex flex-col gap-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} roster={rostersByTeam[team.id] ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateTeamModal({ knownSports }: { knownSports: { id: string; name: string }[] }) {
  const [state, formAction] = useActionState(createTeamAction, initial);
  return (
    <Modal title="Create team" trigger={<PlainButton variant="primary">+ Create team</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <SportPicker knownSports={knownSports} />
        <TextField label="Team name" name="name" required placeholder="e.g. U16 Boys Football" />
        <TextField label="Academic year ID" name="academicYearId" required placeholder="Ask your Admin for the current academic year's ID" />
        <TextField label="Sport category ID" name="sportCategoryId" placeholder="Optional" />
        <TextField label="House ID" name="houseId" placeholder="Optional — enables house-wise performance tracking" />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Creating…">Create team</Button>
      </form>
    </Modal>
  );
}

function TeamCard({ team, roster }: { team: SportsTeam; roster: TeamRosterMember[] }) {
  const [expanded, setExpanded] = useState(false);
  const activeRoster = roster.filter((m) => m.status === "ACTIVE");

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-text">{team.name}</p>
          <p className="mt-0.5 text-xs text-text-muted">
            {team.sportName} · {activeRoster.length} active player{activeRoster.length === 1 ? "" : "s"}
            {team.coachId ? ` · Coach assigned` : " · No coach assigned"}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill state={team.status} />
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs font-bold text-primary hover:underline">
            {expanded ? "Close" : "Manage"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
          <AssignCoachForm teamId={team.id} currentCoachId={team.coachId} />

          <div>
            <p className="mb-2 text-xs font-bold tracking-wide text-text-muted uppercase">Roster</p>
            <ul className="flex flex-col divide-y divide-border">
              {roster.length === 0 && <li className="py-3 text-sm text-text-muted">No roster members yet.</li>}
              {roster.map((m) => (
                <RosterRow key={m.id} teamId={team.id} member={m} />
              ))}
            </ul>
          </div>

          <AddRosterMemberForm teamId={team.id} />
        </div>
      )}
    </div>
  );
}

function AssignCoachForm({ teamId, currentCoachId }: { teamId: string; currentCoachId: string | null }) {
  const action = assignCoachAction.bind(null, teamId);
  const [state, formAction] = useActionState(action, initial);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-[var(--radius-input)] bg-field p-3">
      <div className="min-w-[220px] flex-1">
        <TextField label="Coach ID" name="coachId" defaultValue={currentCoachId ?? ""} placeholder="From the Admin coach catalog" />
      </div>
      <Button variant="secondary" pendingLabel="Assigning…">{currentCoachId ? "Reassign coach" : "Assign coach"}</Button>
      <FieldError message={state.error} />
    </form>
  );
}

function RosterRow({ teamId, member }: { teamId: string; member: TeamRosterMember }) {
  const action = endRosterMemberAction.bind(null, teamId, member.id);
  return (
    <li className="flex items-center justify-between gap-2 py-2.5">
      <div>
        <p className="text-sm font-semibold text-text">
          {member.studentFirstName} {member.studentLastName}
          {member.jerseyNo !== null ? ` · #${member.jerseyNo}` : ""}
        </p>
        <p className="text-xs text-text-muted">{member.role ?? "—"}</p>
      </div>
      <div className="flex items-center gap-2">
        <StatusPill state={member.status} />
        {member.status === "ACTIVE" && (
          <form action={action}>
            <button type="submit" className="text-xs font-bold text-critical-text hover:underline">End</button>
          </form>
        )}
      </div>
    </li>
  );
}

function AddRosterMemberForm({ teamId }: { teamId: string }) {
  const action = addRosterMemberAction.bind(null, teamId);
  const [state, formAction] = useActionState(action, initial);
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-[var(--radius-input)] bg-field p-3">
      <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Add roster member</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextField label="Student ID" name="studentId" required placeholder="Student's UUID" />
        <TextField label="Jersey no." name="jerseyNo" type="number" min="0" max="999" />
        <TextField label="Role" name="role" placeholder="e.g. Forward" />
      </div>
      <FieldError message={state.error} />
      <div>
        <Button variant="secondary" pendingLabel="Adding…">Add to roster</Button>
      </div>
    </form>
  );
}
