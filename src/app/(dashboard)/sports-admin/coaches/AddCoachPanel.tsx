"use client";

import { useActionState, useEffect, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, TextInput } from "@/components/sports-ui/primitives";
import type { StaffSummary } from "@/lib/sports-admin-api";
import { listStaff } from "@/lib/sports-admin-api";
import { createCoachAction, type FormState } from "./actions";

const initial: FormState = {};

export function AddCoachPanel() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createCoachAction, initial);
  const [isExternal, setIsExternal] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StaffSummary[]>([]);
  const [selected, setSelected] = useState<StaffSummary | null>(null);

  useEffect(() => {
    if (isExternal || query.trim().length < 2) { setResults([]); return; }
    const handle = setTimeout(() => {
      listStaff(query.trim()).then((r) => setResults(r.slice(0, 8))).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, isExternal]);

  if (!open) return <PrimaryButton type="button" onClick={() => setOpen(true)}>+ Add coach</PrimaryButton>;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "22px 24px", width: 420 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>New coach / PT staff</div>
      <form action={formAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--sport-ink)" }}>
          <input type="checkbox" name="isExternal" checked={isExternal} onChange={(e) => { setIsExternal(e.target.checked); setSelected(null); }} /> External / visiting coach
        </label>

        {isExternal ? (
          <div><FieldLabel>Full name</FieldLabel><TextInput name="fullName" required placeholder="e.g. Rajendran Coaching Academy" /></div>
        ) : (
          <div style={{ position: "relative" }}>
            <FieldLabel>Staff member</FieldLabel>
            <input type="hidden" name="personId" value={selected?.personId ?? ""} />
            <input type="hidden" name="fullName" value={selected ? `${selected.firstName} ${selected.lastName ?? ""}`.trim() : ""} />
            <TextInput
              value={selected ? `${selected.firstName} ${selected.lastName ?? ""}` : query}
              onChange={(e) => { setSelected(null); setQuery(e.target.value); }}
              placeholder="Search existing staff by name"
            />
            {!selected && results.length > 0 && (
              <div style={{ position: "absolute", zIndex: 5, top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 10, marginTop: 4, boxShadow: "0 8px 24px rgba(16,35,59,0.12)" }}>
                {results.map((s) => (
                  <div key={s.id} onClick={() => { setSelected(s); setResults([]); }} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13.5, borderBottom: "1px solid var(--sport-divider)" }}>
                    {s.firstName} {s.lastName ?? ""} {s.designation ? <span style={{ color: "var(--sport-tertiary)" }}>· {s.designation}</span> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div><FieldLabel>Qualification</FieldLabel><TextInput name="qualification" placeholder="e.g. NIS certified" /></div>
        <div><FieldLabel>Phone</FieldLabel><TextInput name="contactPhone" /></div>
        {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={!isExternal && !selected}>Add</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
