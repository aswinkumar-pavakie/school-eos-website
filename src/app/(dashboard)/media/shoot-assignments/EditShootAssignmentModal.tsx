"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { MediaInventoryItem, MediaTeamMember, ShootAssignment } from "@/lib/media-api";
import { updateShootAssignmentAction, type FormState } from "./actions";

const initial: FormState = {};

export function EditShootAssignmentModal({
  shoot,
  crew,
  gear,
}: {
  shoot: ShootAssignment;
  crew: MediaTeamMember[];
  gear: MediaInventoryItem[];
}) {
  const [state, formAction] = useActionState(updateShootAssignmentAction.bind(null, shoot.id), initial);
  const scheduled = new Date(shoot.scheduledAt);
  const crewIds = new Set(shoot.crew.map((c) => c.id));
  const gearIds = new Set(shoot.gear.map((g) => g.id));

  return (
    <Modal title={`Edit ${shoot.eventTitle}`} trigger={<PlainButton variant="secondary" className="px-2.5 py-1 text-xs">Edit</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Event" name="eventTitle" defaultValue={shoot.eventTitle} required />
        <TextField label="Venue" name="venue" defaultValue={shoot.venue ?? ""} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Date" name="scheduledDate" type="date" defaultValue={scheduled.toISOString().slice(0, 10)} required />
          <TextField label="Time" name="scheduledTime" type="time" defaultValue={scheduled.toISOString().slice(11, 16)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Output" name="outputType" defaultValue={shoot.outputType} required>
            <option value="PHOTO">Photo</option>
            <option value="VIDEO">Video</option>
            <option value="PHOTO_VIDEO">Photo + Video</option>
          </SelectField>
          <SelectField label="Status" name="status" defaultValue={shoot.status} required>
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </SelectField>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-wide text-text-muted uppercase">Crew</span>
          <div className="flex max-h-32 flex-col gap-1.5 overflow-y-auto rounded-[var(--radius-input)] border border-border bg-field p-2.5">
            {crew.map((member) => (
              <label key={member.id} className="flex items-center gap-2 text-sm text-text">
                <input type="checkbox" name="crewIds" value={member.id} defaultChecked={crewIds.has(member.id)} />
                {member.fullName}{member.designation ? ` — ${member.designation}` : ""}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-wide text-text-muted uppercase">Gear issued</span>
          <div className="flex max-h-32 flex-col gap-1.5 overflow-y-auto rounded-[var(--radius-input)] border border-border bg-field p-2.5">
            {gear.map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-sm text-text">
                <input type="checkbox" name="gearIds" value={item.id} defaultChecked={gearIds.has(item.id)} />
                {item.name}{item.assetCode ? ` (${item.assetCode})` : ""}
              </label>
            ))}
          </div>
        </div>

        <TextAreaField label="Notes" name="notes" rows={2} defaultValue={shoot.notes ?? ""} />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">Save changes</Button>
      </form>
    </Modal>
  );
}
