"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { MediaTeamMember } from "@/lib/media-api";
import { updateMediaTeamMemberAction, type FormState } from "./actions";

const initial: FormState = {};

export function EditMediaTeamMemberModal({ member }: { member: MediaTeamMember }) {
  const [state, formAction] = useActionState(updateMediaTeamMemberAction.bind(null, member.id), initial);
  return (
    <Modal title={`Edit ${member.fullName}`} trigger={<PlainButton variant="secondary" className="px-2.5 py-1 text-xs">Edit</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Full name" name="fullName" defaultValue={member.fullName} required />
        <TextField label="Designation" name="designation" defaultValue={member.designation ?? ""} />
        <TextField label="Email" name="email" type="email" defaultValue={member.email ?? ""} />
        <TextField label="Phone" name="phone" defaultValue={member.phone ?? ""} />
        <TextField label="Skills (comma separated)" name="skills" defaultValue={member.skills.join(", ")} />
        <SelectField label="Status" name="status" defaultValue={member.status}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </SelectField>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">Save changes</Button>
      </form>
    </Modal>
  );
}
