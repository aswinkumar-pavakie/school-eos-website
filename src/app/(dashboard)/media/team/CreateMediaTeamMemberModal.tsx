"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { createMediaTeamMemberAction, type FormState } from "./actions";

const initial: FormState = {};

export function CreateMediaTeamMemberModal() {
  const [state, formAction] = useActionState(createMediaTeamMemberAction, initial);
  return (
    <Modal title="Add team member" trigger={<PlainButton variant="primary">+ Add member</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Full name" name="fullName" required />
        <TextField label="Designation" name="designation" placeholder="e.g. Photographer" />
        <TextField label="Email" name="email" type="email" />
        <TextField label="Phone" name="phone" />
        <TextField label="Skills (comma separated)" name="skills" placeholder="Photography, Video editing" />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Adding…">Add member</Button>
      </form>
    </Modal>
  );
}
