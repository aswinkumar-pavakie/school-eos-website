"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { EmptyState, FieldError } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { SignaturePad } from "@/components/sports-faculty/SignaturePad";
import { formatDate } from "@/lib/format";
import type { EquipmentIssue, FacultyEquipment, SportsEquipmentIndent, SportsTeam } from "@/lib/sports-faculty-api";
import { createIndentAction, issueEquipmentAction, returnEquipmentAction, type FormState } from "./actions";

const initial: FormState = {};
const LOW_STOCK_THRESHOLD = 5;

export function EquipmentPanel({
  equipment,
  outstandingIssues,
  overdueIssueIds,
  indents,
  teams,
}: {
  equipment: FacultyEquipment[];
  outstandingIssues: EquipmentIssue[];
  overdueIssueIds: string[];
  indents: SportsEquipmentIndent[];
  teams: SportsTeam[];
}) {
  const overdueSet = new Set(overdueIssueIds);
  const teamById = new Map(teams.map((t) => [t.id, t.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-text">Your equipment</h2>
        {equipment.length === 0 ? (
          <EmptyState title="No equipment yet" body="Your Admin registers equipment under your sport(s) first." />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {equipment.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-text">{item.name}</p>
                  <p className="text-xs text-text-muted">
                    <span className="font-mono">{item.quantityAvailable} / {item.quantityTotal}</span> available
                    {item.condition ? ` · ${item.condition.toLowerCase()}` : ""}
                    {item.quantityAvailable <= LOW_STOCK_THRESHOLD ? " · low stock" : ""}
                  </p>
                </div>
                <IssueEquipmentModal equipment={item} teams={teams} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-text">Currently issued</h2>
        {outstandingIssues.length === 0 ? (
          <p className="text-sm text-text-muted">Nothing currently out.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {outstandingIssues.map((issue) => (
              <li key={issue.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-text">{issue.equipmentName} × {issue.quantity}</p>
                  <p className="text-xs text-text-muted">
                    Issued {formatDate(issue.issuedOn)}
                    {issue.dueOn ? ` · Due ${formatDate(issue.dueOn)}` : ""}
                    {issue.issuedToTeamId ? ` · ${teamById.get(issue.issuedToTeamId) ?? "a team"}` : issue.issuedToStudentId ? " · a student" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  {overdueSet.has(issue.id) && <StatusPill state="OVERDUE" />}
                  <ReturnEquipmentForm issueId={issue.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <RestockSection equipment={equipment} indents={indents} />
    </div>
  );
}

function IssueEquipmentModal({ equipment, teams }: { equipment: FacultyEquipment; teams: SportsTeam[] }) {
  const action = issueEquipmentAction.bind(null, equipment.id);
  const [state, formAction] = useActionState(action, initial);
  const [target, setTarget] = useState<"student" | "team">("student");

  return (
    <Modal title={`Issue ${equipment.name}`} trigger={<PlainButton variant="primary">Issue</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={target === "student"} onChange={() => setTarget("student")} /> To a student
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" checked={target === "team"} onChange={() => setTarget("team")} /> To a team
          </label>
        </div>
        {target === "student" ? (
          <TextField label="Student ID" name="issuedToStudentId" placeholder="Student's UUID" />
        ) : (
          <SelectField label="Team" name="issuedToTeamId" defaultValue="">
            <option value="" disabled>Choose a team…</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </SelectField>
        )}
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Quantity" name="quantity" type="number" min="1" max={equipment.quantityAvailable} required defaultValue="1" />
          <TextField label="Due on" name="dueOn" type="date" />
        </div>
        <TextAreaField label="Reason" name="reason" required rows={2} placeholder="e.g. Training session" />
        <SignaturePad name="signaturePngBase64" />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Issuing…">Issue equipment</Button>
      </form>
    </Modal>
  );
}

function ReturnEquipmentForm({ issueId }: { issueId: string }) {
  const action = returnEquipmentAction.bind(null, issueId);
  const [state, formAction] = useActionState(action, initial);
  return (
    <Modal title="Record return" trigger={<PlainButton variant="secondary">Return</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Condition on return" name="conditionOnReturn" placeholder="e.g. Good" />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">Confirm return</Button>
      </form>
    </Modal>
  );
}

function RestockSection({
  equipment,
  indents,
}: {
  equipment: FacultyEquipment[];
  indents: SportsEquipmentIndent[];
}) {
  const [state, formAction] = useActionState(createIndentAction, initial);
  const sorted = [...indents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <h2 className="mb-1 text-sm font-bold text-text">Restock requests</h2>
      <p className="mb-4 text-xs text-text-muted">Route: You → Principal → Finance. Approval increments the equipment&apos;s own stock once delivered.</p>

      <form action={formAction} className="mb-4 flex flex-col gap-3 rounded-[var(--radius-input)] bg-field p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField label="Equipment" name="equipmentId" required defaultValue="">
            <option value="" disabled>Choose…</option>
            {equipment.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </SelectField>
          <TextField label="Quantity" name="quantity" type="number" min="1" required defaultValue="1" />
        </div>
        <TextAreaField label="Reason" name="reason" required rows={2} placeholder="e.g. Running low before tournament" />
        <FieldError message={state.error} />
        <div>
          <Button variant="secondary" pendingLabel="Submitting…">Submit restock request</Button>
        </div>
      </form>

      {sorted.length === 0 ? (
        <p className="text-sm text-text-muted">No restock requests yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {sorted.map((indent) => (
            <li key={indent.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div>
                <p className="text-sm font-semibold text-text">{indent.itemName}</p>
                <p className="text-xs text-text-muted">
                  #{indent.referenceNo} · Qty {indent.quantity ?? "—"} · Raised {formatDate(indent.createdAt)}
                </p>
              </div>
              <StatusPill state={indent.state} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
