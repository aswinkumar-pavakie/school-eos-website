"use client";

import { useActionState, useState, useTransition } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, TextArea, TextInput } from "@/components/sports-ui/primitives";
import { DeleteButton } from "@/components/sports-ui/DeleteButton";
import { useFlash } from "@/components/sports-ui/FlashContext";
import type { InjuryStatus, SportsInjury } from "@/lib/sports-admin-api";
import { deleteInjuryAction, markGuardianInformedAction, updateInjuryAction, updateInjuryStatusAction, type FormState } from "./actions";

const OPTIONS: InjuryStatus[] = ["UNDER_CARE", "OBSERVATION", "CLOSED"];
const initial: FormState = {};

export function InjuryRowActions({ injury }: { injury: SportsInjury }) {
  const { id, status, guardianInformed } = injury;
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const { showFlash } = useFlash();
  const boundUpdate = updateInjuryAction.bind(null, id);
  const [state, formAction] = useActionState(boundUpdate, initial);

  if (editing) {
    return (
      <div style={{ position: "absolute", zIndex: 15, top: "100%", right: 0, marginTop: 4, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 12, padding: "16px 18px", width: 320, boxShadow: "0 12px 32px rgba(16,35,59,0.16)" }}>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div><FieldLabel>Title</FieldLabel><TextInput name="title" required defaultValue={injury.title} /></div>
          <div><FieldLabel>Description</FieldLabel><TextArea name="description" rows={2} defaultValue={injury.description ?? ""} /></div>
          <div><FieldLabel>Incident date</FieldLabel><TextInput name="incidentDate" type="date" required defaultValue={injury.incidentDate.slice(0, 10)} /></div>
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
    <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end", position: "relative" }}>
      {!guardianInformed && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              try {
                await markGuardianInformedAction(id);
                showFlash("Guardian marked as informed.");
              } catch (err) {
                showFlash(err instanceof Error ? err.message : "That didn't work. Please try again.");
              }
            });
          }}
          style={{ height: 28, padding: "0 10px", fontSize: 11.5, fontWeight: 700, border: "1px solid var(--sport-border)", borderRadius: 8, background: "#fff", color: "var(--sport-body)", cursor: "pointer" }}
        >
          Inform guardian
        </button>
      )}
      <select
        disabled={pending}
        value={status}
        onChange={(e) => {
          const next = e.target.value as InjuryStatus;
          if (next === status) return;
          startTransition(async () => {
            try {
              await updateInjuryStatusAction(id, next);
              showFlash(`Case marked ${next.toLowerCase().replace("_", " ")}.`);
            } catch (err) {
              showFlash(err instanceof Error ? err.message : "That didn't work. Please try again.");
            }
          });
        }}
        style={{ height: 30, fontSize: 12, border: "1px solid var(--sport-border)", borderRadius: 8, color: "var(--sport-body)" }}
      >
        {OPTIONS.map((o) => (
          <option key={o} value={o}>
            {o[0]}
            {o.slice(1).toLowerCase().replace("_", " ")}
          </option>
        ))}
      </select>
      <button type="button" onClick={() => setEditing(true)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-primary)", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
        Edit
      </button>
      <DeleteButton
        confirmMessage={`Delete "${injury.title}"? This cannot be undone.`}
        action={() => deleteInjuryAction(id)}
        successMessage="Case deleted."
      />
    </div>
  );
}
