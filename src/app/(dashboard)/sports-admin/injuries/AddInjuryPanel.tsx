"use client";

import { useActionState, useEffect, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, TextArea, TextInput } from "@/components/sports-ui/primitives";
import type { Sport, StudentSummary } from "@/lib/sports-admin-api";
import { createInjuryAction, type FormState } from "./actions";

const initial: FormState = {};

async function fetchJson<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) return [];
  const body = (await res.json()) as { data: T[] };
  return body.data;
}

export function AddInjuryPanel({ sports }: { sports: Sport[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createInjuryAction, initial);
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

  if (!open) return <PrimaryButton type="button" onClick={() => setOpen(true)}>+ Record incident</PrimaryButton>;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "22px 24px", width: 420 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>New injury / incident</div>
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
        <div>
          <FieldLabel>Sport (optional)</FieldLabel>
          <Select name="sportId" defaultValue="">
            <option value="">Not sport-specific</option>
            {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <div><FieldLabel>Title</FieldLabel><TextInput name="title" required placeholder="e.g. Ankle sprain during practice" /></div>
        <div><FieldLabel>Description (optional)</FieldLabel><TextArea name="description" rows={2} /></div>
        <div><FieldLabel>Incident date</FieldLabel><TextInput name="incidentDate" type="date" required /></div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--sport-body)" }}>
          <input type="checkbox" name="guardianInformed" />
          Guardian already informed
        </label>
        {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={!selected}>Record</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
