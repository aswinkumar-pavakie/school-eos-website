"use client";

import { useActionState, useEffect, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, TextInput } from "@/components/sports-ui/primitives";
import type { StudentSummary } from "@/lib/sports-admin-api";
import { recordPointsAction, type FormState } from "./actions";

const initial: FormState = {};

interface HouseOption {
  houseId: string;
  houseName: string;
}

export function RecordPointsPanel({ houses }: { houses: HouseOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(recordPointsAction, initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentSummary[]>([]);
  const [selected, setSelected] = useState<StudentSummary | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const handle = setTimeout(() => {
      fetch(`/api/students-search?search=${encodeURIComponent(query.trim())}`)
        .then((res) => (res.ok ? res.json() : { data: [] }))
        .then((body: { data: StudentSummary[] }) => setResults(body.data.slice(0, 8)))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  if (!open) return <PrimaryButton type="button" onClick={() => setOpen(true)}>+ Record points</PrimaryButton>;

  return (
    <div style={{ position: "absolute", zIndex: 15, top: "calc(100% + 8px)", right: 0, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 12, padding: "18px 20px", width: 380, boxShadow: "0 12px 32px rgba(16,35,59,0.16)" }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--sport-heading)", marginBottom: 12 }}>Record inter-house points</div>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
          <FieldLabel>House</FieldLabel>
          <Select name="houseId" required defaultValue="">
            <option value="" disabled>Select a house</option>
            {houses.map((h) => <option key={h.houseId} value={h.houseId}>{h.houseName}</option>)}
          </Select>
        </div>
        <div>
          <FieldLabel>Points (1-20)</FieldLabel>
          <TextInput name="points" type="number" min={1} max={20} required />
        </div>
        <div>
          <FieldLabel>Reason</FieldLabel>
          <TextInput name="reason" placeholder="e.g. Won the inter-house kabaddi final" required />
        </div>
        {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={!selected}>Record</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
