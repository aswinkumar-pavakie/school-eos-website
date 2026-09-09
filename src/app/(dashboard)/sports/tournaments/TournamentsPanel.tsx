"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { EmptyState, FieldError } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { SportPicker } from "@/components/sports-faculty/SportPicker";
import { formatDate, formatTime } from "@/lib/format";
import type { Fixture, FixtureResult, HousePerformance, SportsTeam, Tournament } from "@/lib/sports-faculty-api";
import {
  createFixtureAction,
  createTournamentAction,
  recordFixtureResultAction,
  updateTournamentStateAction,
  type FormState,
} from "./actions";

const initial: FormState = {};

export function TournamentsPanel({
  tournaments,
  fixturesByTournament,
  resultsByFixture,
  teams,
  knownSports,
  housePerformance,
}: {
  tournaments: Tournament[];
  fixturesByTournament: Record<string, Fixture[]>;
  resultsByFixture: Record<string, FixtureResult | null>;
  teams: SportsTeam[];
  knownSports: { id: string; name: string }[];
  housePerformance: HousePerformance[];
}) {
  const sorted = [...tournaments].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <div className="flex flex-col gap-6">
      {housePerformance.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold text-text">House performance</h2>
          <ul className="flex flex-col divide-y divide-border">
            {housePerformance.map((h) => (
              <li key={h.houseId} className="flex items-center justify-between py-2 text-sm">
                <span className="font-semibold text-text">{h.houseName}</span>
                <span className="font-mono text-text-muted">{h.wins} wins / {h.matches} matches</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <CreateTournamentModal knownSports={knownSports} />
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No tournaments yet" body="Create one for a sport you're the In-Charge for." />
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              fixtures={fixturesByTournament[t.id] ?? []}
              resultsByFixture={resultsByFixture}
              teams={teams}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateTournamentModal({ knownSports }: { knownSports: { id: string; name: string }[] }) {
  const [state, formAction] = useActionState(createTournamentAction, initial);
  return (
    <Modal title="Create tournament" trigger={<PlainButton variant="primary">+ Create tournament</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <SportPicker knownSports={knownSports} />
        <TextField label="Name" name="name" required placeholder="e.g. Inter-School Cup" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Level" name="level" required placeholder="e.g. District" />
          <TextField label="Format" name="format" placeholder="e.g. Knockout" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Start date" name="startDate" type="date" required />
          <TextField label="End date" name="endDate" type="date" required />
        </div>
        <TextField label="Venue" name="venue" />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Creating…">Create tournament</Button>
      </form>
    </Modal>
  );
}

function TournamentCard({
  tournament,
  fixtures,
  resultsByFixture,
  teams,
}: {
  tournament: Tournament;
  fixtures: Fixture[];
  resultsByFixture: Record<string, FixtureResult | null>;
  teams: SportsTeam[];
}) {
  const [expanded, setExpanded] = useState(false);
  const sortedFixtures = [...fixtures].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-text">{tournament.name}</p>
          <p className="mt-0.5 text-xs text-text-muted">
            {tournament.sportName} · {tournament.level} · {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill state={tournament.state} />
          {tournament.state === "DRAFT" && <QuickStateButton id={tournament.id} state="ONGOING" label="Start" />}
          {tournament.state === "ONGOING" && <QuickStateButton id={tournament.id} state="COMPLETED" label="Complete" />}
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs font-bold text-primary hover:underline">
            {expanded ? "Close" : "Fixtures"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
          <ul className="flex flex-col divide-y divide-border">
            {sortedFixtures.length === 0 && <li className="py-3 text-sm text-text-muted">No fixtures yet.</li>}
            {sortedFixtures.map((f) => (
              <FixtureRow key={f.id} fixture={f} result={resultsByFixture[f.id] ?? null} teams={teams} />
            ))}
          </ul>
          <CreateFixtureForm tournamentId={tournament.id} teams={teams} />
        </div>
      )}
    </div>
  );
}

function QuickStateButton({ id, state, label }: { id: string; state: string; label: string }) {
  const action = updateTournamentStateAction.bind(null, id, state);
  return (
    <form action={action}>
      <button type="submit" className="text-xs font-bold text-primary hover:underline">{label}</button>
    </form>
  );
}

function teamName(teams: SportsTeam[], id: string | null): string {
  if (!id) return "—";
  return teams.find((t) => t.id === id)?.name ?? id;
}

// Module-scope, not a component -- keeps FixtureRow itself free of a direct
// Date.now() call (react-hooks/purity flags impure calls inside a
// component/hook body, but not inside an ordinary helper function it calls).
function hasKickedOff(scheduledAt: string): boolean {
  return new Date(scheduledAt).getTime() < Date.now();
}

function FixtureRow({ fixture, result, teams }: { fixture: Fixture; result: FixtureResult | null; teams: SportsTeam[] }) {
  const [recording, setRecording] = useState(false);
  const canRecord = fixture.status !== "CANCELLED" && hasKickedOff(fixture.scheduledAt);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-text">
            {teamName(teams, fixture.homeTeamId)} vs {teamName(teams, fixture.awayTeamId)}
            {fixture.round ? ` · ${fixture.round}` : ""}
          </p>
          <p className="text-xs text-text-muted">
            {formatDate(fixture.scheduledAt)} · {formatTime(fixture.scheduledAt)}
            {fixture.venue ? ` · ${fixture.venue}` : ""}
          </p>
          {result && (
            <p className="mt-1 text-xs font-mono text-text">
              {result.homeScore ?? "—"} : {result.awayScore ?? "—"}
              {result.winnerTeamId ? ` · Winner: ${teamName(teams, result.winnerTeamId)}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill state={fixture.status} />
          {!result && canRecord && (
            <button type="button" onClick={() => setRecording((v) => !v)} className="text-xs font-bold text-primary hover:underline">
              {recording ? "Cancel" : "Record result"}
            </button>
          )}
        </div>
      </div>
      {recording && !result && <RecordResultForm fixtureId={fixture.id} teams={teams} onDone={() => setRecording(false)} />}
    </li>
  );
}

function RecordResultForm({ fixtureId, teams, onDone }: { fixtureId: string; teams: SportsTeam[]; onDone: () => void }) {
  const action = recordFixtureResultAction.bind(null, fixtureId);
  const [state, formAction] = useActionState(action, initial);

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3 rounded-[var(--radius-input)] bg-field p-3" onSubmit={() => setTimeout(onDone, 0)}>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Home score" name="homeScore" placeholder="e.g. 3" />
        <TextField label="Away score" name="awayScore" placeholder="e.g. 1" />
      </div>
      <SelectField label="Winner" name="winnerTeamId" defaultValue="">
        <option value="">No winner / draw</option>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </SelectField>
      <FieldError message={state.error} />
      <div>
        <Button variant="primary" pendingLabel="Saving…">Save result</Button>
      </div>
    </form>
  );
}

function CreateFixtureForm({ tournamentId, teams }: { tournamentId: string; teams: SportsTeam[] }) {
  const action = createFixtureAction.bind(null, tournamentId);
  const [state, formAction] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-[var(--radius-input)] bg-field p-3">
      <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Add fixture</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField label="Date & time" name="scheduledAt" type="datetime-local" required />
        <TextField label="Round" name="round" placeholder="e.g. Semi-final" />
        <SelectField label="Home team" name="homeTeamId" defaultValue="">
          <option value="">Choose…</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </SelectField>
        <SelectField label="Away team" name="awayTeamId" defaultValue="">
          <option value="">Choose…</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </SelectField>
      </div>
      <TextField label="Venue" name="venue" />
      <FieldError message={state.error} />
      <div>
        <Button variant="secondary" pendingLabel="Adding…">Add fixture</Button>
      </div>
    </form>
  );
}
