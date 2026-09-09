"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { EmptyState, FieldError } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate } from "@/lib/format";
import type { Fixture, SportOdRequest, SportsTeam } from "@/lib/sports-faculty-api";
import { createOdRequestAction, type FormState } from "./actions";

const initial: FormState = {};

export function OdRequestsPanel({
  odRequests,
  teams,
  fixtures,
}: {
  odRequests: SportOdRequest[];
  teams: SportsTeam[];
  fixtures: Fixture[];
}) {
  const sorted = [...odRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CreateOdRequestModal teams={teams} fixtures={fixtures} />
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No OD requests yet" body="Submit one for a team's match or event." />
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((r) => (
            <div key={r.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-text">{r.teamName}</p>
                  <p className="mt-1 text-sm text-text-muted">{r.reason}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {r.sportName} · Event date {formatDate(r.eventDate)} · Submitted {formatDate(r.createdAt)}
                  </p>
                </div>
                <StatusPill state={r.state} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateOdRequestModal({ teams, fixtures }: { teams: SportsTeam[]; fixtures: Fixture[] }) {
  const [state, formAction] = useActionState(createOdRequestAction, initial);
  return (
    <Modal title="Submit OD request" trigger={<PlainButton variant="primary">+ Submit OD request</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <SelectField label="Team" name="teamId" required defaultValue="">
          <option value="" disabled>Choose a team…</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </SelectField>
        <SelectField label="Fixture" name="fixtureId" defaultValue="">
          <option value="">Optional — none</option>
          {fixtures.map((f) => (
            <option key={f.id} value={f.id}>{f.round ?? "Fixture"} · {formatDate(f.scheduledAt)}</option>
          ))}
        </SelectField>
        <TextField label="Event date" name="eventDate" type="date" required />
        <TextAreaField label="Reason" name="reason" required rows={3} placeholder="e.g. Inter-school football tournament" />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Submitting…">Submit request</Button>
      </form>
    </Modal>
  );
}
