"use client";

import { useActionState, useEffect, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, TextArea, TextInput } from "@/components/sports-ui/primitives";
import type { Sport, StudentSummary, TrialRound } from "@/lib/sports-admin-api";
import { createTrialAction, type FormState } from "./actions";

const initial: FormState = {};

// Inlined rather than imported as a value from sports-admin-api.ts -- that
// module pulls in api.ts's cookies()-using apiFetch, which next/headers
// forbids in a client bundle (this exact panel broke the build until this
// was fixed: every other client panel in this directory only ever imports
// *types* from sports-admin-api.ts, never a runtime value, for this reason).
const TRIAL_ROUNDS: TrialRound[] = ["ROUND_1", "ROUND_2", "FINAL_ROUND"];

async function fetchJson<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) return [];
  const body = (await res.json()) as { data: T[] };
  return body.data;
}

export function AddTrialPanel({ sports }: { sports: Sport[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createTrialAction, initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentSummary[]>([]);
  const [selected, setSelected] = useState<StudentSummary | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const handle = setTimeout(() => {
      fetchJson<StudentSummary>(`/api/students-search?search=${encodeURIComponent(query.trim())}`)
        .then((r) => setResults(r.slice(0, 8)))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  if (!open) return <PrimaryButton type="button" onClick={() => setOpen(true)}>+ Schedule trial</PrimaryButton>;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "22px 24px", width: 420 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>New trial</div>
      <form action={formAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <input type="hidden" name="studentId" value={selected?.id ?? ""} />
        <div style={{ position: "relative" }}>
          <FieldLabel>Candidate</FieldLabel>
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
        <div>
          <FieldLabel>Sport</FieldLabel>
          <Select name="sportId" required defaultValue="">
            <option value="" disabled>Select a sport</option>
            {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <div>
          <FieldLabel>Round</FieldLabel>
          <Select name="round" defaultValue="ROUND_1">
            {TRIAL_ROUNDS.map((r) => <option key={r} value={r}>{r === "ROUND_1" ? "Round 1" : r === "ROUND_2" ? "Round 2" : "Final round"}</option>)}
          </Select>
        </div>
        <div><FieldLabel>Trial date</FieldLabel><TextInput name="trialDate" type="date" required /></div>
        <div><FieldLabel>Score (optional)</FieldLabel><TextInput name="score" placeholder="e.g. 12.4s, 8/10" /></div>
        <div><FieldLabel>Notes (optional)</FieldLabel><TextArea name="notes" rows={2} /></div>
        {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={!selected}>Schedule</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
