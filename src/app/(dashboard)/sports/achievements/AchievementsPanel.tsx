"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { EmptyState, FieldError } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";
import type { SportsAchievement, SportsTeam, Tournament } from "@/lib/sports-faculty-api";
import { createAchievementAction, type FormState } from "./actions";

const initial: FormState = {};

export function AchievementsPanel({
  achievements,
  teams,
  tournaments,
}: {
  achievements: SportsAchievement[];
  teams: SportsTeam[];
  tournaments: Tournament[];
}) {
  const sorted = [...achievements].sort((a, b) => new Date(b.awardedOn).getTime() - new Date(a.awardedOn).getTime());

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CreateAchievementModal teams={teams} tournaments={tournaments} />
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No achievements yet" body="Record a student's placement in a team or tournament." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((a) => (
            <div key={a.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
              <p className="font-bold text-text">{a.studentFirstName} {a.studentLastName}</p>
              <p className="mt-1 text-sm font-semibold text-primary">{a.placement}</p>
              <p className="mt-1 text-xs text-text-muted">
                {a.teamName ?? a.tournamentName ?? "—"} · {formatDate(a.awardedOn)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateAchievementModal({ teams, tournaments }: { teams: SportsTeam[]; tournaments: Tournament[] }) {
  const [state, formAction] = useActionState(createAchievementAction, initial);
  return (
    <Modal title="Record achievement" trigger={<PlainButton variant="primary">+ Record achievement</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Student ID" name="studentId" required placeholder="Student's UUID" />
        <SelectField label="Team" name="teamId" defaultValue="">
          <option value="">— None —</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </SelectField>
        <SelectField label="Tournament" name="tournamentId" defaultValue="">
          <option value="">— None —</option>
          {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </SelectField>
        <p className="-mt-2 text-xs text-text-muted">Pick at least one of Team or Tournament.</p>
        <TextField label="Placement" name="placement" required placeholder="e.g. 1st Place" />
        <TextField label="Awarded on" name="awardedOn" type="date" required />
        <TextField label="Title" name="title" placeholder="Optional" />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Recording…">Record achievement</Button>
      </form>
    </Modal>
  );
}
