"use client";

import { useActionState, useEffect, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, TextInput } from "@/components/sports-ui/primitives";
import type { Coach, SportsTeam } from "@/lib/sports-admin-api";
import { listCoaches, listMyTeams } from "@/lib/sports-admin-api";
import { createTrainingSessionAction, type FormState } from "./actions";

const initial: FormState = {};

export function AddSessionPanel() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createTrainingSessionAction, initial);
  const [teams, setTeams] = useState<SportsTeam[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([listMyTeams(), listCoaches()]).then(([t, c]) => {
      setTeams(t);
      setCoaches(c);
    }).catch(() => {});
  }, [open]);

  if (!open) {
    return <PrimaryButton type="button" onClick={() => setOpen(true)}>+ Schedule session</PrimaryButton>;
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "22px 24px", width: 420 }}>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>Schedule training</div>
      <form action={formAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <FieldLabel>Squad</FieldLabel>
          <Select name="teamId" required defaultValue="">
            <option value="" disabled>Select a squad</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.sportName}</option>)}
          </Select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><FieldLabel>Date</FieldLabel><TextInput name="date" type="date" required /></div>
          <div><FieldLabel>Time</FieldLabel><TextInput name="time" type="time" required /></div>
        </div>
        <div><FieldLabel>Venue</FieldLabel><TextInput name="venue" placeholder="e.g. Main ground" /></div>
        <div><FieldLabel>Focus</FieldLabel><TextInput name="focus" placeholder="e.g. Fitness & drills" /></div>
        <div>
          <FieldLabel>Conducted by</FieldLabel>
          <Select name="conductedByCoachId" defaultValue="">
            <option value="">Not set</option>
            {coaches.filter((c) => c.status === "ACTIVE").map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
          </Select>
        </div>
        {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
          <PrimaryButton type="submit">Schedule</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
