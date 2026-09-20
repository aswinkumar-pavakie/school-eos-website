"use client";

import { useActionState, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, TextInput } from "@/components/sports-ui/primitives";
import type { Sport } from "@/lib/sports-admin-api";
import { enrollSportAction, type FormState } from "./actions";

const initial: FormState = {};

export function EnrollSportPanel({ studentId, availableSports }: { studentId: string; availableSports: Sport[] }) {
  const [open, setOpen] = useState(false);
  const boundAction = enrollSportAction.bind(null, studentId);
  const [state, formAction] = useActionState(boundAction, initial);

  if (!open) {
    return (
      <PrimaryButton type="button" onClick={() => setOpen(true)} style={{ height: 34, fontSize: 13 }}>
        + Enroll in a sport
      </PrimaryButton>
    );
  }

  return (
    <form
      action={(fd) => {
        formAction(fd);
      }}
      style={{ display: "flex", flexDirection: "column", gap: 12, background: "var(--sport-panel, #f7f8fa)", border: "1px solid var(--sport-border)", borderRadius: 12, padding: 16 }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <FieldLabel>Sport</FieldLabel>
          <Select name="sportId" required defaultValue="">
            <option value="" disabled>
              Select a sport
            </option>
            {availableSports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel>Position / role (optional)</FieldLabel>
          <TextInput name="positionOrRole" placeholder="e.g. Forward, Sprinter" />
        </div>
      </div>
      {state.error && (
        <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <SecondaryButton type="button" onClick={() => setOpen(false)}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={availableSports.length === 0}>
          Enroll
        </PrimaryButton>
      </div>
      {availableSports.length === 0 && <div style={{ fontSize: 12.5, color: "var(--sport-tertiary-2)" }}>Already enrolled in every sport.</div>}
    </form>
  );
}
