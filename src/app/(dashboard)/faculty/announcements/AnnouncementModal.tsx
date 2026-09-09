"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { Announcement } from "@/lib/faculty-api";
import { createAnnouncementAction, updateAnnouncementAction, type FormState } from "./actions";

const initial: FormState = {};

export function AnnouncementModal({
  classes,
  announcement,
}: {
  classes: { sectionId: string; label: string }[];
  announcement?: Announcement;
}) {
  const action = announcement ? updateAnnouncementAction.bind(null, announcement.id) : createAnnouncementAction;
  const [state, formAction] = useActionState(action, initial);
  const currentSectionIds = new Set(
    announcement?.audiences.filter((a) => a.audienceType === "SECTION").map((a) => a.targetId) ?? [],
  );

  return (
    <Modal
      title={announcement ? "Edit announcement" : "New announcement"}
      trigger={<PlainButton variant={announcement ? "secondary" : "primary"}>{announcement ? "Edit" : "+ New announcement"}</PlainButton>}
    >
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Title" name="title" defaultValue={announcement?.title} required />
        <TextAreaField label="Message" name="body" rows={4} defaultValue={announcement?.body} required />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Category (optional)" name="category" defaultValue={announcement?.category ?? ""} />
          <SelectField label="Priority" name="priority" defaultValue={announcement?.priority ?? "NORMAL"}>
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </SelectField>
        </div>
        <TextField label="Expires on (optional)" name="expiresAt" type="date" defaultValue={announcement?.expiresAt?.slice(0, 10) ?? ""} />
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="isEmergency" defaultChecked={announcement?.isEmergency} className="h-4 w-4 rounded border-border" />
          Mark as emergency
        </label>

        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">Send to</p>
          <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-[var(--radius-input)] border border-border p-2">
            {classes.length === 0 ? (
              <p className="p-2 text-sm text-text-muted">You have no classes to send to.</p>
            ) : (
              classes.map((c) => (
                <label key={c.sectionId} className="flex items-center gap-2 rounded-[var(--radius-input)] px-2 py-1.5 text-sm text-text hover:bg-field">
                  <input type="checkbox" name="targetSectionIds" value={c.sectionId} defaultChecked={currentSectionIds.has(c.sectionId)} className="h-4 w-4 rounded border-border" />
                  {c.label}
                </label>
              ))
            )}
          </div>
        </div>

        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">{announcement ? "Save changes" : "Post announcement"}</Button>
      </form>
    </Modal>
  );
}
