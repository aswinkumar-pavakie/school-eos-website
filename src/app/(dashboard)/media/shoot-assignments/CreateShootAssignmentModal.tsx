"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { MediaInventoryItem, MediaTeamMember } from "@/lib/media-api";
import { createShootAssignmentAction, type FormState } from "./actions";

const initial: FormState = {};

export function CreateShootAssignmentModal({ crew, gear }: { crew: MediaTeamMember[]; gear: MediaInventoryItem[] }) {
  const [state, formAction] = useActionState(createShootAssignmentAction, initial);
  return (
    <Modal title="Add shoot assignment" trigger={<PlainButton variant="primary">+ Add shoot assignment</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Event" name="eventTitle" required placeholder="e.g. TechFest 2026 – Code Sprint" />
        <TextField label="Venue" name="venue" placeholder="e.g. Main Block" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Date" name="scheduledDate" type="date" required />
          <TextField label="Time" name="scheduledTime" type="time" required />
        </div>
        <SelectField label="Output" name="outputType" defaultValue="PHOTO_VIDEO" required>
          <option value="PHOTO">Photo</option>
          <option value="VIDEO">Video</option>
          <option value="PHOTO_VIDEO">Photo + Video</option>
        </SelectField>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-wide text-text-muted uppercase">Crew</span>
          <div className="flex max-h-32 flex-col gap-1.5 overflow-y-auto rounded-[var(--radius-input)] border border-border bg-field p-2.5">
            {crew.length === 0 ? (
              <p className="text-xs text-text-muted">No active team members yet — add one under Media Team first.</p>
            ) : (
              crew.map((member) => (
                <label key={member.id} className="flex items-center gap-2 text-sm text-text">
                  <input type="checkbox" name="crewIds" value={member.id} />
                  {member.fullName}{member.designation ? ` — ${member.designation}` : ""}
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-wide text-text-muted uppercase">Gear issued</span>
          <div className="flex max-h-32 flex-col gap-1.5 overflow-y-auto rounded-[var(--radius-input)] border border-border bg-field p-2.5">
            {gear.length === 0 ? (
              <p className="text-xs text-text-muted">No equipment registered yet — add one under Inventory first.</p>
            ) : (
              gear.map((item) => (
                <label key={item.id} className="flex items-center gap-2 text-sm text-text">
                  <input type="checkbox" name="gearIds" value={item.id} />
                  {item.name}{item.assetCode ? ` (${item.assetCode})` : ""}
                </label>
              ))
            )}
          </div>
        </div>

        <TextAreaField label="Notes" name="notes" rows={2} />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Adding…">Add shoot assignment</Button>
      </form>
    </Modal>
  );
}
