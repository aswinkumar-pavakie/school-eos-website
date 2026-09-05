"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlainButton, Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { Obligation } from "@/lib/finance-api";
import { updateObligationAction, type FormState } from "./actions";

const initial: FormState = {};

/** Only ever rendered for a PENDING obligation with no payments yet — the backend
 * itself re-enforces that on every call regardless. */
export function EditObligationModal({ obligation }: { obligation: Obligation }) {
  const [state, formAction] = useActionState(updateObligationAction.bind(null, obligation.id), initial);
  return (
    <Modal title="Edit obligation" trigger={<PlainButton variant="secondary" className="px-2.5 py-1 text-xs">Edit</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Amount (₹)" name="amountRupees" type="number" min="0" step="0.01" defaultValue={(Number(obligation.amountPaise) / 100).toString()} required />
        <TextField label="Due date" name="dueDate" type="date" defaultValue={obligation.dueDate.slice(0, 10)} required />
        <FieldError message={state.error} />
        <Button variant="secondary" pendingLabel="Saving…">Save changes</Button>
      </form>
    </Modal>
  );
}
