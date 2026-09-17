"use client";

// Sports Admin -> Fixtures. Tournaments (with their fixtures nested) -- real
// createTournament/createFixture/recordFixtureResult calls only.

import { useActionState, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, StatusPill, TextInput, toneOf } from "@/components/sports-ui/primitives";
import { statusLabel } from "@/lib/format";
import type { Fixture, Sport, SportsTeam, Tournament } from "@/lib/sports-admin-api";
import { createFixtureAction, createTournamentAction, recordFixtureResultAction, type FormState } from "./actions";

const initial: FormState = {};

export function CreateTournamentPanel({ sports }: { sports: Sport[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createTournamentAction, initial);

  if (!open) return <PrimaryButton type="button" onClick={() => setOpen(true)}>+ New tournament</PrimaryButton>;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "22px 24px", width: 420 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>New tournament</div>
      <form action={formAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <FieldLabel>Sport</FieldLabel>
          <Select name="sportId" required defaultValue="">
            <option value="" disabled>Select a sport</option>
            {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <div><FieldLabel>Tournament name</FieldLabel><TextInput name="name" required /></div>
        <div>
          <FieldLabel>Level</FieldLabel>
          <Select name="level" required defaultValue="">
            <option value="" disabled>Select level</option>
            <option value="INTER_HOUSE">Inter-house</option>
            <option value="INTER_SCHOOL">Inter-school</option>
            <option value="BLOCK">Block</option>
            <option value="DISTRICT">District</option>
            <option value="STATE">State</option>
            <option value="NATIONAL">National</option>
          </Select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><FieldLabel>Start date</FieldLabel><TextInput name="startDate" type="date" required /></div>
          <div><FieldLabel>End date</FieldLabel><TextInput name="endDate" type="date" required /></div>
        </div>
        <div><FieldLabel>Venue</FieldLabel><TextInput name="venue" placeholder="Optional" /></div>
        {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Create</PrimaryButton>
        </div>
      </form>
    </div>
  );
}

export function TournamentCard({ tournament, fixtures, teams }: { tournament: Tournament; fixtures: Fixture[]; teams: SportsTeam[] }) {
  const [expanded, setExpanded] = useState(false);
  const teamById = new Map(teams.map((t) => [t.id, t.name]));

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, padding: "18px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--sport-ink)" }}>{tournament.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--sport-tertiary)", marginTop: 3 }}>
            {tournament.sportName} · {statusLabel(tournament.level)} · {tournament.venue ?? "Venue TBD"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <StatusPill label={statusLabel(tournament.state)} tone={toneOf(tournament.state)} />
          <button type="button" onClick={() => setExpanded((v) => !v)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-primary)", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
            {expanded ? "Close" : `${fixtures.length} fixture${fixtures.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, borderTop: "1px solid var(--sport-divider)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {fixtures.map((f) => (
            <FixtureRow key={f.id} fixture={f} homeTeam={f.homeTeamId ? teamById.get(f.homeTeamId) ?? "—" : "—"} awayTeam={f.awayTeamId ? teamById.get(f.awayTeamId) ?? "—" : "—"} />
          ))}
          <AddFixtureForm tournamentId={tournament.id} teams={teams.filter((t) => t.sportId === tournament.sportId)} />
        </div>
      )}
    </div>
  );
}

function FixtureRow({ fixture, homeTeam, awayTeam }: { fixture: Fixture; homeTeam: string; awayTeam: string }) {
  const [recording, setRecording] = useState(false);
  const action = recordFixtureResultAction.bind(null, fixture.id);
  const [state, formAction] = useActionState(action, initial);

  return (
    <div style={{ background: "var(--sport-panel)", borderRadius: 10, padding: "12px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--sport-ink)" }}>{homeTeam} vs {awayTeam}{fixture.round ? ` · ${fixture.round}` : ""}</div>
          <div style={{ fontSize: 12, color: "var(--sport-tertiary)", marginTop: 2 }}>
            {new Date(fixture.scheduledAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
            {fixture.venue ? ` · ${fixture.venue}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StatusPill label={statusLabel(fixture.status)} tone={toneOf(fixture.status)} />
          <button type="button" onClick={() => setRecording((v) => !v)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-primary)", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
            {recording ? "Close" : "Result"}
          </button>
        </div>
      </div>
      {recording && (
        <form action={formAction} style={{ display: "flex", gap: 10, alignItems: "flex-end", marginTop: 10 }}>
          <div><FieldLabel>Home score</FieldLabel><TextInput name="homeScore" style={{ width: 100 }} /></div>
          <div><FieldLabel>Away score</FieldLabel><TextInput name="awayScore" style={{ width: 100 }} /></div>
          <SecondaryButton type="submit">Save</SecondaryButton>
          {state.error && <span style={{ fontSize: 12, color: "var(--sport-red)" }}>{state.error}</span>}
        </form>
      )}
    </div>
  );
}

function AddFixtureForm({ tournamentId, teams }: { tournamentId: string; teams: SportsTeam[] }) {
  const action = createFixtureAction.bind(null, tournamentId);
  const [state, formAction] = useActionState(action, initial);
  return (
    <form action={formAction} style={{ background: "var(--sport-panel)", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.09em", fontWeight: 700, color: "var(--sport-muted)", textTransform: "uppercase" }}>Add fixture</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><FieldLabel>Date</FieldLabel><TextInput name="date" type="date" required /></div>
        <div><FieldLabel>Time</FieldLabel><TextInput name="time" type="time" required /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <FieldLabel>Home squad</FieldLabel>
          <Select name="homeTeamId" defaultValue="">
            <option value="">—</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </div>
        <div>
          <FieldLabel>Away squad</FieldLabel>
          <Select name="awayTeamId" defaultValue="">
            <option value="">—</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><FieldLabel>Round</FieldLabel><TextInput name="round" placeholder="e.g. Semi-final" /></div>
        <div><FieldLabel>Venue</FieldLabel><TextInput name="venue" /></div>
      </div>
      {state.error && <div style={{ fontSize: 12, color: "var(--sport-red)" }}>{state.error}</div>}
      <div><SecondaryButton type="submit">Add fixture</SecondaryButton></div>
    </form>
  );
}
