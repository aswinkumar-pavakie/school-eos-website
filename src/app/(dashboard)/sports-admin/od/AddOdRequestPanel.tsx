"use client";

import { useActionState, useEffect, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, TextArea, TextInput } from "@/components/sports-ui/primitives";
import type { SportsTeam } from "@/lib/sports-admin-api";
import { createOdRequestAction, type FormState } from "./actions";

const initial: FormState = {};

// Same httpOnly-cookie reasoning as AddTeamPanel.tsx -- fetch the Route
// Handler, never sports-admin-api.ts's own functions, from a client component.
async function fetchJson<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) return [];
  const body = (await res.json()) as { data: T[] };
  return body.data;
}

// Pixel-matched to the design's own `isOd` field set (Duty type, Event/
// purpose, Venue, Level, Escorting staff, Transport, remarks) -- see
// actions.ts's own header comment for why these all compose into the one
// real `reason` field the backend actually has, rather than being dropped.
export function AddOdRequestPanel() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createOdRequestAction, initial);
  const [teams, setTeams] = useState<SportsTeam[]>([]);

  useEffect(() => {
    if (!open) return;
    fetchJson<SportsTeam>("/api/sports-admin/teams").then(setTeams).catch(() => {});
  }, [open]);

  if (!open) return <PrimaryButton type="button" onClick={() => setOpen(true)}>+ OD letter</PrimaryButton>;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "22px 24px", width: 460 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>Player on-duty</div>
      <form action={formAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14, maxHeight: "70vh", overflowY: "auto" }}>
        <div>
          <FieldLabel>Squad</FieldLabel>
          <Select name="teamId" required defaultValue="">
            <option value="" disabled>Select a squad</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.sportName}</option>)}
          </Select>
        </div>
        <div>
          <FieldLabel>Duty type</FieldLabel>
          <Select name="dutyType" defaultValue="Inter-school tournament">
            <option>Inter-school tournament</option>
            <option>District meet</option>
            <option>State selection camp</option>
            <option>Friendly fixture</option>
          </Select>
        </div>
        <div><FieldLabel>Event date</FieldLabel><TextInput name="eventDate" type="date" required /></div>
        <div><FieldLabel>Event / purpose</FieldLabel><TextInput name="purpose" required placeholder="e.g. District Athletics Meet" /></div>
        <div><FieldLabel>Venue / host school</FieldLabel><TextInput name="venue" placeholder="Optional" /></div>
        <div>
          <FieldLabel>Level</FieldLabel>
          <Select name="level" defaultValue="Inter-school">
            <option>Inter-school</option>
            <option>District</option>
            <option>State</option>
            <option>National</option>
          </Select>
        </div>
        <div><FieldLabel>Escorting PT staff</FieldLabel><TextInput name="escort" placeholder="Optional" /></div>
        <div>
          <FieldLabel>Transport</FieldLabel>
          <Select name="transport" defaultValue="School bus">
            <option>School bus</option>
            <option>Hired van</option>
            <option>Parent drop</option>
          </Select>
        </div>
        <div><FieldLabel>Class adjustment & remarks</FieldLabel><TextArea name="remarks" rows={3} placeholder="Optional" /></div>
        {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Submit request to principal</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
