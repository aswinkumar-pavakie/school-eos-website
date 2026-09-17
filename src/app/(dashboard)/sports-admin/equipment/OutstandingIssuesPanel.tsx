"use client";

import { useActionState, useState } from "react";
import { FieldLabel, SecondaryButton, StatusPill, TextInput } from "@/components/sports-ui/primitives";
import { formatDate } from "@/lib/format";
import type { EquipmentIssue, SportsTeam } from "@/lib/sports-admin-api";
import { returnEquipmentAction, type FormState } from "./actions";

const initial: FormState = {};

export function OutstandingIssuesPanel({ issues, overdueIds, teams }: { issues: EquipmentIssue[]; overdueIds: Set<string>; teams: SportsTeam[] }) {
  const teamById = new Map(teams.map((t) => [t.id, t.name]));

  if (issues.length === 0) {
    return <div style={{ padding: "30px 20px", textAlign: "center", fontSize: 14, color: "var(--sport-tertiary)", background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14 }}>Nothing currently issued.</div>;
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 14, overflow: "hidden" }}>
      {issues.map((issue, i) => (
        <div key={issue.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: i > 0 ? "1px solid var(--sport-divider)" : undefined, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--sport-ink)" }}>{issue.equipmentName} × {issue.quantity}</div>
            <div style={{ fontSize: 12.5, color: "var(--sport-tertiary)", marginTop: 2 }}>
              Issued {formatDate(issue.issuedOn)}
              {issue.dueOn ? ` · Due ${formatDate(issue.dueOn)}` : ""}
              {issue.issuedToTeamId ? ` · ${teamById.get(issue.issuedToTeamId) ?? "a squad"}` : issue.issuedToStudentId ? " · a student" : ""}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {overdueIds.has(issue.id) && <StatusPill label="Overdue" tone="bad" />}
            <ReturnForm issueId={issue.id} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReturnForm({ issueId }: { issueId: string }) {
  const [open, setOpen] = useState(false);
  const action = returnEquipmentAction.bind(null, issueId);
  const [state, formAction] = useActionState(action, initial);

  if (!open) return <SecondaryButton type="button" onClick={() => setOpen(true)}>Return</SecondaryButton>;

  return (
    <form action={formAction} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
      <div>
        <FieldLabel>Condition</FieldLabel>
        <TextInput name="conditionOnReturn" placeholder="e.g. Good" style={{ width: 140 }} />
      </div>
      <SecondaryButton type="submit">Confirm</SecondaryButton>
      {state.error && <span style={{ fontSize: 12, color: "var(--sport-red)" }}>{state.error}</span>}
    </form>
  );
}
