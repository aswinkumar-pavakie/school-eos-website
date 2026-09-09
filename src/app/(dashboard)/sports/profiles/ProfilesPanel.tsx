"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { EmptyState, FieldError } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate } from "@/lib/format";
import type { SportsProfile } from "@/lib/sports-faculty-api";
import { createProfileAction, updateProfileAction, type FormState } from "./actions";

const initial: FormState = {};

export function ProfilesPanel({ sportId, profiles }: { sportId: string; profiles: SportsProfile[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">{profiles.length} profile{profiles.length === 1 ? "" : "s"}.</p>
        <CreateProfileModal sportId={sportId} />
      </div>

      {profiles.length === 0 ? (
        <EmptyState title="No profiles yet" body="Add a student's profile for this sport." />
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-[var(--radius-card)] border border-border bg-surface px-4">
          {profiles.map((p) => (
            <ProfileRow key={p.id} sportId={sportId} profile={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CreateProfileModal({ sportId }: { sportId: string }) {
  const action = createProfileAction.bind(null, sportId);
  const [state, formAction] = useActionState(action, initial);
  return (
    <Modal title="Add player profile" trigger={<PlainButton variant="primary">+ Add profile</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Student ID" name="studentId" required placeholder="Student's UUID" />
        <TextField label="Position / role" name="positionOrRole" placeholder="e.g. Striker" />
        <TextField label="Joined on" name="joinedOn" type="date" />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">Save profile</Button>
      </form>
    </Modal>
  );
}

function ProfileRow({ sportId, profile }: { sportId: string; profile: SportsProfile }) {
  const [editing, setEditing] = useState(false);
  const action = updateProfileAction.bind(null, sportId, profile.id);
  const [state, formAction] = useActionState(action, initial);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-text">{profile.studentFirstName} {profile.studentLastName}</p>
          <p className="text-xs text-text-muted">
            {profile.positionOrRole ?? "—"} · Joined {formatDate(profile.joinedOn)}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill state={profile.status} />
          <button type="button" onClick={() => setEditing((v) => !v)} className="text-xs font-bold text-primary hover:underline">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>
      {editing && (
        <form action={formAction} className="mt-3 flex flex-col gap-2.5 rounded-[var(--radius-input)] bg-field p-3">
          <div className="grid grid-cols-2 gap-2.5">
            <TextField label="Position / role" name="positionOrRole" defaultValue={profile.positionOrRole ?? ""} />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold tracking-wide text-text-muted uppercase">Status</span>
              <select
                name="status"
                defaultValue={profile.status}
                className="rounded-[var(--radius-input)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
          </div>
          <FieldError message={state.error} />
          <div>
            <Button variant="primary" pendingLabel="Saving…">Save changes</Button>
          </div>
        </form>
      )}
    </li>
  );
}
