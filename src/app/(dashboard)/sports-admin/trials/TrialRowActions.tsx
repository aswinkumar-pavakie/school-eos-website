"use client";

import { useActionState, useState, useTransition } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, TextInput } from "@/components/sports-ui/primitives";
import { DeleteButton } from "@/components/sports-ui/DeleteButton";
import { useFlash } from "@/components/sports-ui/FlashContext";
import { TRIAL_ROUNDS, type SportsTrial, type TrialStatus } from "@/lib/sports-admin-trial-types";
import { deleteTrialAction, updateTrialAction, updateTrialStatusAction, type FormState } from "./actions";

const STATUS_OPTIONS: TrialStatus[] = ["PENDING", "HOLD", "SELECTED", "NOT_SELECTED"];
const ROUND_LABEL: Record<string, string> = { ROUND_1: "Round 1", ROUND_2: "Round 2", FINAL_ROUND: "Final round" };
const initial: FormState = {};

export function TrialRowActions({ trial }: { trial: SportsTrial }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const { showFlash } = useFlash();
  const boundUpdate = updateTrialAction.bind(null, trial.id);
  const [state, formAction] = useActionState(boundUpdate, initial);

  if (editing) {
    return (
      <div style={{ position: "absolute", zIndex: 15, top: "100%", right: 0, marginTop: 4, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 12, padding: "16px 18px", width: 300, boxShadow: "0 12px 32px rgba(16,35,59,0.16)" }}>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <FieldLabel>Round</FieldLabel>
            <Select name="round" defaultValue={trial.round}>
              {TRIAL_ROUNDS.map((r) => <option key={r} value={r}>{ROUND_LABEL[r]}</option>)}
            </Select>
          </div>
          <div><FieldLabel>Trial date</FieldLabel><TextInput name="trialDate" type="date" required defaultValue={trial.trialDate.slice(0, 10)} /></div>
          <div><FieldLabel>Score</FieldLabel><TextInput name="score" defaultValue={trial.score ?? ""} /></div>
          <div><FieldLabel>Notes</FieldLabel><TextInput name="notes" defaultValue={trial.notes ?? ""} /></div>
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
    <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
      <select
        disabled={pending}
        value={trial.status}
        onChange={(e) => {
          const next = e.target.value as TrialStatus;
          if (next === trial.status) return;
          startTransition(async () => {
            try {
              await updateTrialStatusAction(trial.id, next);
              showFlash(`Trial marked ${next.toLowerCase().replace("_", " ")}.`);
            } catch (err) {
              showFlash(err instanceof Error ? err.message : "That didn't work. Please try again.");
            }
          });
        }}
        style={{ height: 30, fontSize: 12, border: "1px solid var(--sport-border)", borderRadius: 8, color: "var(--sport-body)" }}
      >
        {STATUS_OPTIONS.map((o) => (
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
        confirmMessage={`Delete this trial for ${trial.studentFirstName} ${trial.studentLastName ?? ""}? This cannot be undone.`}
        action={() => deleteTrialAction(trial.id)}
        successMessage="Trial deleted."
      />
    </div>
  );
}
