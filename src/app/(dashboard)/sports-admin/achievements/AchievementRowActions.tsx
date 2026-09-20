"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { FieldLabel, PrimaryButton, Select, SecondaryButton, TextInput } from "@/components/sports-ui/primitives";
import { DeleteButton } from "@/components/sports-ui/DeleteButton";
import type { SportsAchievement } from "@/lib/sports-admin-api";
import { deleteAchievementAction, updateAchievementAction, type FormState } from "./actions";

const LEVELS = ["SCHOOL", "BLOCK", "DISTRICT", "STATE", "NATIONAL", "INTERNATIONAL"];
const initial: FormState = {};

export function AchievementRowActions({ achievement }: { achievement: SportsAchievement }) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateAchievementAction.bind(null, achievement.id);
  const [state, formAction] = useActionState(boundUpdate, initial);

  if (editing) {
    return (
      <div style={{ position: "absolute", zIndex: 15, top: "100%", right: 0, marginTop: 4, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 12, padding: "16px 18px", width: 300, boxShadow: "0 12px 32px rgba(16,35,59,0.16)" }}>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div><FieldLabel>Title</FieldLabel><TextInput name="title" defaultValue={achievement.title ?? ""} /></div>
          <div><FieldLabel>Placement</FieldLabel><TextInput name="placement" required defaultValue={achievement.placement} /></div>
          <div>
            <FieldLabel>Level</FieldLabel>
            <Select name="level" defaultValue={achievement.level ?? "SCHOOL"}>
              {LEVELS.map((l) => <option key={l} value={l}>{l[0]}{l.slice(1).toLowerCase()}</option>)}
            </Select>
          </div>
          <div><FieldLabel>Date</FieldLabel><TextInput name="awardedOn" type="date" required defaultValue={achievement.awardedOn.slice(0, 10)} /></div>
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
    <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end", position: "relative" }}>
      <Link href={`/sports-admin/students/${achievement.studentId}`} style={{ fontSize: 13, fontWeight: 700, color: "var(--sport-primary)", textDecoration: "none" }}>
        View player
      </Link>
      <button type="button" onClick={() => setEditing(true)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--sport-primary)", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
        Edit
      </button>
      <DeleteButton
        confirmMessage={`Delete this achievement (${achievement.placement})? This cannot be undone.`}
        action={() => deleteAchievementAction(achievement.id)}
        successMessage="Achievement deleted."
      />
    </div>
  );
}
