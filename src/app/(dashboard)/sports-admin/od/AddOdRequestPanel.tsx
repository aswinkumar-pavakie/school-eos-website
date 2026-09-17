"use client";

import { useActionState, useEffect, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, TextArea, TextInput } from "@/components/sports-ui/primitives";
import type { SportsTeam } from "@/lib/sports-admin-api";
import { listMyTeams } from "@/lib/sports-admin-api";
import { createOdRequestAction, type FormState } from "./actions";

const initial: FormState = {};

export function AddOdRequestPanel() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createOdRequestAction, initial);
  const [teams, setTeams] = useState<SportsTeam[]>([]);

  useEffect(() => {
    if (!open) return;
    listMyTeams().then(setTeams).catch(() => {});
  }, [open]);

  if (!open) return <PrimaryButton type="button" onClick={() => setOpen(true)}>+ New OD request</PrimaryButton>;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "22px 24px", width: 420 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>New OD request</div>
      <form action={formAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <FieldLabel>Squad</FieldLabel>
          <Select name="teamId" required defaultValue="">
            <option value="" disabled>Select a squad</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.sportName}</option>)}
          </Select>
        </div>
        <div><FieldLabel>Event date</FieldLabel><TextInput name="eventDate" type="date" required /></div>
        <div><FieldLabel>Reason</FieldLabel><TextArea name="reason" required rows={3} placeholder="e.g. District Athletics Meet — away fixture" /></div>
        {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Submit</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
