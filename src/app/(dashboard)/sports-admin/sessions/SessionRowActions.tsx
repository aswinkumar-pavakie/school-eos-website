"use client";

import { useActionState, useState } from "react";
import { FieldLabel, PrimaryButton, Select, SecondaryButton, TextInput } from "@/components/sports-ui/primitives";
import type { Coach, TrainingSession } from "@/lib/sports-admin-api";
import { updateSessionAction, type FormState } from "./actions";
import { SessionStatusAction } from "./SessionStatusAction";

const initial: FormState = {};

function toLocalDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toLocalTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Full-record Edit alongside the existing status dropdown (whose own
// "Cancelled" option is this screen's real Delete -- no hard-delete route
// exists for a training session).
export function SessionRowActions({ session, coaches }: { session: TrainingSession; coaches: Coach[] }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateSessionAction.bind(null, session.id);
  const [state, formAction] = useActionState(boundUpdate, initial);

  if (editing) {
    return (
      <div style={{ position: "absolute", zIndex: 15, top: "100%", right: 0, marginTop: 4, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 12, padding: "16px 18px", width: 300, boxShadow: "0 12px 32px rgba(16,35,59,0.16)" }}>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><FieldLabel>Date</FieldLabel><TextInput name="date" type="date" required defaultValue={toLocalDate(session.scheduledAt)} /></div>
            <div><FieldLabel>Time</FieldLabel><TextInput name="time" type="time" required defaultValue={toLocalTime(session.scheduledAt)} /></div>
          </div>
          <div><FieldLabel>Venue</FieldLabel><TextInput name="venue" defaultValue={session.venue ?? ""} /></div>
          <div><FieldLabel>Focus</FieldLabel><TextInput name="focus" defaultValue={session.focus ?? ""} /></div>
          <div>
            <FieldLabel>Coach</FieldLabel>
            <Select name="conductedByCoachId" defaultValue={session.conductedByCoachId ?? ""}>
              <option value="">Not assigned</option>
              {coaches.map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </Select>
          </div>
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
      <SessionStatusAction id={session.id} status={session.status} />
      {session.status === "SCHEDULED" ? (
        <button type="button" onClick={() => setEditing(true)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-primary)", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
          Edit
        </button>
      ) : null}
    </div>
  );
}
