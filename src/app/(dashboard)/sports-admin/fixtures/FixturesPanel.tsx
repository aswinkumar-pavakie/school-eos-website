"use client";

// Sports Admin -> Fixtures. The design's own `fixtures` screen is a flat
// table (['FIXTURE','OPPONENT','DATE · TIME','VENUE','LEVEL','RESULT']) --
// but the real schema's fixtures are matches BETWEEN this school's own
// squads within a tournament (home_team_id/away_team_id, both real teams
// here), not "us vs an external opponent school" the way the design's mock
// data assumes. Flattening into the design's exact table would misrepresent
// that: this stays tournament-grouped, real createTournament/createFixture/
// recordFixtureResult calls only, but pixel-matched to the same th/td
// spacing (16px 26px / 13px 26px, 11px/700/0.09em headers) every other
// register screen in this module uses.

import { useActionState, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, StatusPill, TextInput, toneOf } from "@/components/sports-ui/primitives";
import { DeleteButton } from "@/components/sports-ui/DeleteButton";
import { statusLabel } from "@/lib/format";
import type { Fixture, Sport, SportsTeam, Tournament } from "@/lib/sports-admin-api";
import {
  createFixtureAction,
  createTournamentAction,
  recordFixtureResultAction,
  setFixtureStatusAction,
  setTournamentStateAction,
  updateFixtureAction,
  updateTournamentAction,
  type FormState,
} from "./actions";

const initial: FormState = {};
const th = { padding: "13px 20px", textAlign: "left" as const, fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: "var(--sport-tertiary-2)", whiteSpace: "nowrap" as const };
const td = { padding: "14px 20px", fontSize: 13.5, color: "var(--sport-body)", verticalAlign: "middle" as const };

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
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, padding: "18px 24px" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--sport-ink)" }}>{tournament.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--sport-tertiary-2)", marginTop: 3 }}>
            {tournament.sportName} · {statusLabel(tournament.level)} · {tournament.venue ?? "Venue TBD"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <StatusPill label={statusLabel(tournament.state)} tone={toneOf(tournament.state)} />
          <TournamentActions tournament={tournament} />
          <button type="button" onClick={() => setExpanded((v) => !v)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-primary)", fontSize: 13, fontWeight: 700, fontFamily: "inherit" }}>
            {expanded ? "Close" : `${fixtures.length} fixture${fixtures.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--sport-divider)" }}>
          {fixtures.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["FIXTURE", "DATE · TIME", "VENUE", "RESULT", ""].map((h) => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {fixtures.map((f, i) => (
                  <FixtureRow
                    key={f.id}
                    fixture={f}
                    bordered={i > 0}
                    homeTeam={f.homeTeamId ? teamById.get(f.homeTeamId) ?? "—" : "—"}
                    awayTeam={f.awayTeamId ? teamById.get(f.awayTeamId) ?? "—" : "—"}
                    teams={teams.filter((t) => t.sportId === tournament.sportId)}
                  />
                ))}
              </tbody>
            </table>
          )}
          <div style={{ padding: "16px 24px", borderTop: fixtures.length > 0 ? "1px solid var(--sport-divider)" : undefined }}>
            <AddFixtureForm tournamentId={tournament.id} teams={teams.filter((t) => t.sportId === tournament.sportId)} />
          </div>
        </div>
      )}
    </div>
  );
}

function FixtureRow({ fixture, homeTeam, awayTeam, bordered, teams }: { fixture: Fixture; homeTeam: string; awayTeam: string; bordered: boolean; teams: SportsTeam[] }) {
  const [recording, setRecording] = useState(false);
  const [editing, setEditing] = useState(false);
  const action = recordFixtureResultAction.bind(null, fixture.id);
  const [state, formAction] = useActionState(action, initial);
  const editAction = updateFixtureAction.bind(null, fixture.id);
  const [editState, editFormAction] = useActionState(editAction, initial);

  return (
    <>
      <tr style={{ borderTop: bordered ? "1px solid var(--sport-divider)" : undefined }}>
        <td style={td}>
          <span style={{ fontWeight: 700, color: "var(--sport-ink)" }}>{homeTeam} vs {awayTeam}</span>
          {fixture.round ? <div style={{ fontSize: 12, color: "var(--sport-tertiary-2)", marginTop: 2 }}>{fixture.round}</div> : null}
        </td>
        <td style={{ ...td, fontFamily: "var(--sport-mono)", fontSize: 12.5, color: "var(--sport-muted-2)" }}>
          {new Date(fixture.scheduledAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
        </td>
        <td style={td}>{fixture.venue ?? "—"}</td>
        <td style={td}><StatusPill label={statusLabel(fixture.status)} tone={toneOf(fixture.status)} /></td>
        <td style={{ ...td, textAlign: "right" }}>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setRecording((v) => !v)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-primary)", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
              {recording ? "Close" : "Result"}
            </button>
            {fixture.status !== "CANCELLED" && fixture.status !== "COMPLETED" ? (
              <>
                <button type="button" onClick={() => setEditing((v) => !v)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-primary)", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
                  {editing ? "Close" : "Edit"}
                </button>
                <DeleteButton
                  label="Cancel"
                  confirmMessage="Cancel this fixture?"
                  action={() => setFixtureStatusAction(fixture.id, "CANCELLED")}
                  successMessage="Fixture cancelled."
                />
              </>
            ) : null}
          </div>
        </td>
      </tr>
      {recording && (
        <tr>
          <td colSpan={5} style={{ padding: "0 20px 14px" }}>
            <form action={formAction} style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "var(--sport-panel)", borderRadius: 10, padding: 14 }}>
              <div><FieldLabel>Home score</FieldLabel><TextInput name="homeScore" style={{ width: 100 }} /></div>
              <div><FieldLabel>Away score</FieldLabel><TextInput name="awayScore" style={{ width: 100 }} /></div>
              <SecondaryButton type="submit">Save</SecondaryButton>
              {state.error && <span style={{ fontSize: 12, color: "var(--sport-red)" }}>{state.error}</span>}
            </form>
          </td>
        </tr>
      )}
      {editing && (
        <tr>
          <td colSpan={5} style={{ padding: "0 20px 14px" }}>
            <form action={editFormAction} style={{ display: "flex", flexDirection: "column", gap: 10, background: "var(--sport-panel)", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><FieldLabel>Date</FieldLabel><TextInput name="date" type="date" required defaultValue={fixture.scheduledAt.slice(0, 10)} /></div>
                <div><FieldLabel>Time</FieldLabel><TextInput name="time" type="time" required defaultValue={new Date(fixture.scheduledAt).toTimeString().slice(0, 5)} /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <FieldLabel>Home squad</FieldLabel>
                  <Select name="homeTeamId" defaultValue={fixture.homeTeamId ?? ""}>
                    <option value="">—</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </div>
                <div>
                  <FieldLabel>Away squad</FieldLabel>
                  <Select name="awayTeamId" defaultValue={fixture.awayTeamId ?? ""}>
                    <option value="">—</option>
                    {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><FieldLabel>Round</FieldLabel><TextInput name="round" defaultValue={fixture.round ?? ""} /></div>
                <div><FieldLabel>Venue</FieldLabel><TextInput name="venue" defaultValue={fixture.venue ?? ""} /></div>
              </div>
              {editState.error && <span style={{ fontSize: 12, color: "var(--sport-red)" }}>{editState.error}</span>}
              <div><SecondaryButton type="submit">Save</SecondaryButton></div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}

function TournamentActions({ tournament }: { tournament: Tournament }) {
  const [editing, setEditing] = useState(false);
  const editAction = updateTournamentAction.bind(null, tournament.id);
  const [state, formAction] = useActionState(editAction, initial);

  if (tournament.state === "CANCELLED" || tournament.state === "COMPLETED") return null;

  if (editing) {
    return (
      <div style={{ position: "absolute", zIndex: 15, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 12, padding: "16px 18px", width: 300, boxShadow: "0 12px 32px rgba(16,35,59,0.16)" }}>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div><FieldLabel>Tournament name</FieldLabel><TextInput name="name" required defaultValue={tournament.name} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><FieldLabel>Start date</FieldLabel><TextInput name="startDate" type="date" required defaultValue={tournament.startDate.slice(0, 10)} /></div>
            <div><FieldLabel>End date</FieldLabel><TextInput name="endDate" type="date" required defaultValue={tournament.endDate.slice(0, 10)} /></div>
          </div>
          <div><FieldLabel>Venue</FieldLabel><TextInput name="venue" defaultValue={tournament.venue ?? ""} /></div>
          {state.error && <div style={{ fontSize: 12, color: "var(--sport-red)", fontWeight: 600 }}>{state.error}</div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <SecondaryButton type="button" onClick={() => setEditing(false)} style={{ height: 30, fontSize: 12 }}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" style={{ height: 30, fontSize: 12 }}>Save</PrimaryButton>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", position: "relative" }}>
      <button type="button" onClick={() => setEditing(true)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-primary)", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
        Edit
      </button>
      <DeleteButton
        label="Cancel"
        confirmMessage={`Cancel "${tournament.name}"? Its fixtures stay on record.`}
        action={() => setTournamentStateAction(tournament.id, "CANCELLED")}
        successMessage="Tournament cancelled."
      />
    </div>
  );
}

function AddFixtureForm({ tournamentId, teams }: { tournamentId: string; teams: SportsTeam[] }) {
  const action = createFixtureAction.bind(null, tournamentId);
  const [state, formAction] = useActionState(action, initial);
  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
