"use client";

// Squad detail -- roster add/remove + coach (re)assignment. Real backend
// only: addRosterMember/endRosterMember/assignCoach (Faculty's own
// /sports/teams/:id/... routes, now SPORTS_ADMIN-authorized for every
// sport). Student picker uses real listStudents() search, not a static list.

import { useActionState, useEffect, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, StatusPill, TextInput } from "@/components/sports-ui/primitives";
import type { Coach, StudentSummary } from "@/lib/sports-admin-api";
import type { TeamRosterMember } from "@/lib/sports-faculty-api";
import { addRosterMemberAction, assignCoachAction, endRosterMemberAction, type FormState } from "./actions";

const initial: FormState = {};

export function AssignCoachPanel({ teamId, currentCoachId, coaches }: { teamId: string; currentCoachId: string | null; coaches: Coach[] }) {
  const action = assignCoachAction.bind(null, teamId);
  const [state, formAction] = useActionState(action, initial);
  return (
    <form action={formAction} style={{ display: "flex", alignItems: "flex-end", gap: 12, background: "var(--sport-panel)", borderRadius: 12, padding: 16 }}>
      <div style={{ flex: 1, maxWidth: 320 }}>
        <FieldLabel>In-charge coach</FieldLabel>
        <select name="coachId" defaultValue={currentCoachId ?? ""} style={{ width: "100%", height: 44, marginTop: 8, border: "1px solid var(--sport-input-border)", borderRadius: 10, padding: "0 13px", fontSize: 14, fontFamily: "inherit", color: "var(--sport-ink)" }}>
          <option value="">Not assigned</option>
          {coaches.filter((c) => c.status === "ACTIVE").map((c) => (
            <option key={c.id} value={c.id}>{c.fullName}</option>
          ))}
        </select>
      </div>
      <PrimaryButton type="submit">{currentCoachId ? "Reassign" : "Assign"}</PrimaryButton>
      {state.error && <span style={{ fontSize: 12.5, color: "var(--sport-red)", fontWeight: 600 }}>{state.error}</span>}
    </form>
  );
}

export function RosterList({ teamId, roster }: { teamId: string; roster: TeamRosterMember[] }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, overflow: "hidden" }}>
      {roster.length === 0 ? (
        <div style={{ padding: "30px 20px", textAlign: "center", fontSize: 14, color: "var(--sport-tertiary)" }}>No players on this squad yet.</div>
      ) : (
        roster.map((m, i) => <RosterRow key={m.id} teamId={teamId} member={m} bordered={i > 0} />)
      )}
    </div>
  );
}

function RosterRow({ teamId, member, bordered }: { teamId: string; member: TeamRosterMember; bordered: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleEnd() {
    setPending(true);
    const result = await endRosterMemberAction(teamId, member.id);
    setPending(false);
    if (result.error) setError(result.error);
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: bordered ? "1px solid var(--sport-divider)" : undefined }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>
          {member.studentFirstName} {member.studentLastName}
          {member.jerseyNo !== null ? ` · #${member.jerseyNo}` : ""}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--sport-tertiary)", marginTop: 2 }}>{member.role ?? "—"}</div>
        {error && <div style={{ fontSize: 12, color: "var(--sport-red)", marginTop: 4 }}>{error}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <StatusPill label={member.status === "ACTIVE" ? "Active" : "Removed"} tone={member.status === "ACTIVE" ? "good" : "mute"} />
        {member.status === "ACTIVE" && (
          <button type="button" onClick={handleEnd} disabled={pending} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-red)", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
            {pending ? "Removing…" : "Remove"}
          </button>
        )}
      </div>
    </div>
  );
}

export function AddRosterMemberPanel({ teamId }: { teamId: string }) {
  const action = addRosterMemberAction.bind(null, teamId);
  const [state, formAction] = useActionState(action, initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentSummary[]>([]);
  const [selected, setSelected] = useState<StudentSummary | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      // Reuses the app's existing authenticated student-search Route Handler
      // (its access-token cookie can only be read server-side, so this
      // component can't call listStudents() directly -- same reasoning as
      // every other picker in this module).
      fetch(`/api/students-search?search=${encodeURIComponent(query.trim())}`)
        .then((res) => (res.ok ? res.json() : { data: [] }))
        .then((body: { data: StudentSummary[] }) => setResults(body.data.slice(0, 8)))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div style={{ background: "var(--sport-panel)", borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.09em", fontWeight: 700, color: "var(--sport-muted)", textTransform: "uppercase", marginBottom: 10 }}>Add player</div>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input type="hidden" name="studentId" value={selected?.id ?? ""} />
        <div style={{ position: "relative" }}>
          <FieldLabel>Student</FieldLabel>
          <TextInput
            value={selected ? `${selected.firstName} ${selected.lastName ?? ""} · ${selected.admissionNo}` : query}
            onChange={(e) => {
              setSelected(null);
              setQuery(e.target.value);
            }}
            placeholder="Search by name or admission no."
          />
          {!selected && results.length > 0 && (
            <div style={{ position: "absolute", zIndex: 5, top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 10, marginTop: 4, boxShadow: "0 8px 24px rgba(16,35,59,0.12)" }}>
              {results.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelected(s);
                    setResults([]);
                  }}
                  style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13.5, borderBottom: "1px solid var(--sport-divider)" }}
                >
                  {s.firstName} {s.lastName ?? ""} <span style={{ color: "var(--sport-tertiary)" }}>· {s.admissionNo}{s.gradeName ? ` · ${s.gradeName}${s.sectionName ? ` ${s.sectionName}` : ""}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <FieldLabel>Jersey no.</FieldLabel>
            <TextInput name="jerseyNo" type="number" min={0} max={999} />
          </div>
          <div>
            <FieldLabel>Position / role</FieldLabel>
            <TextInput name="role" placeholder="e.g. Forward" />
          </div>
        </div>
        {state.error && <div style={{ fontSize: 12.5, color: "var(--sport-red)", fontWeight: 600 }}>{state.error}</div>}
        <div>
          <SecondaryButton type="submit" disabled={!selected}>Add to squad</SecondaryButton>
        </div>
      </form>
    </div>
  );
}
