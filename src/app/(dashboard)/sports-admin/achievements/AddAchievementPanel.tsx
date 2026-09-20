"use client";

import { useActionState, useEffect, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, TextInput } from "@/components/sports-ui/primitives";
import type { StudentSummary, SportsTeam } from "@/lib/sports-admin-api";
import { createAchievementAction, type FormState } from "./actions";

const initial: FormState = {};

// Same httpOnly-cookie reasoning documented across every panel in this
// module: a "use client" component can't call sports-admin-api.ts's own
// functions directly, so it fetches a Route Handler instead.
async function fetchJson<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) return [];
  const body = (await res.json()) as { data: T[] };
  return body.data;
}

export function AddAchievementPanel() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createAchievementAction, initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentSummary[]>([]);
  const [selected, setSelected] = useState<StudentSummary | null>(null);
  const [teams, setTeams] = useState<SportsTeam[]>([]);

  useEffect(() => {
    if (!open) return;
    fetchJson<SportsTeam>("/api/sports-admin/teams").then(setTeams).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const handle = setTimeout(() => {
      fetchJson<StudentSummary>(`/api/students-search?search=${encodeURIComponent(query.trim())}`)
        .then((r) => setResults(r.slice(0, 8)))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  if (!open) return <PrimaryButton type="button" onClick={() => setOpen(true)}>+ Add achievement</PrimaryButton>;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "22px 24px", width: 420 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>New achievement</div>
      <form action={formAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <input type="hidden" name="studentId" value={selected?.id ?? ""} />
        <div style={{ position: "relative" }}>
          <FieldLabel>Student</FieldLabel>
          <TextInput
            value={selected ? `${selected.firstName} ${selected.lastName ?? ""} · ${selected.admissionNo}` : query}
            onChange={(e) => { setSelected(null); setQuery(e.target.value); }}
            placeholder="Search by name or admission no."
          />
          {!selected && results.length > 0 && (
            <div style={{ position: "absolute", zIndex: 5, top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 10, marginTop: 4, boxShadow: "0 8px 24px rgba(16,35,59,0.12)" }}>
              {results.map((s) => (
                <div key={s.id} onClick={() => { setSelected(s); setResults([]); }} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13.5, borderBottom: "1px solid var(--sport-divider)" }}>
                  {s.firstName} {s.lastName ?? ""} <span style={{ color: "var(--sport-tertiary)" }}>· {s.admissionNo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div><FieldLabel>Title</FieldLabel><TextInput name="title" placeholder="e.g. District Athletics Meet" /></div>
        <div><FieldLabel>Placement</FieldLabel><TextInput name="placement" required placeholder="e.g. 1st place, Gold medal" /></div>
        <div>
          <FieldLabel>Competition level</FieldLabel>
          <Select name="level" defaultValue="SCHOOL">
            <option value="SCHOOL">School</option>
            <option value="BLOCK">Block</option>
            <option value="DISTRICT">District</option>
            <option value="STATE">State</option>
            <option value="NATIONAL">National</option>
            <option value="INTERNATIONAL">International</option>
          </Select>
        </div>
        <div>
          <FieldLabel>Squad</FieldLabel>
          <Select name="teamId" required defaultValue="">
            <option value="" disabled>Select a squad</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </div>
        <div><FieldLabel>Awarded on</FieldLabel><TextInput name="awardedOn" type="date" required /></div>
        {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={!selected}>Record</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
