"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlainButton, Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { createObligationAction, type FormState } from "./actions";

const initial: FormState = {};

// For the genuine one-off case (2.2: "a late admission fee, a specific fine") — the
// student must already have a student_fee_assignment row; this doesn't create one.
export function CreateObligationModal() {
  const [state, formAction] = useActionState(createObligationAction, initial);
  return (
    <Modal title="Create obligation" trigger={<PlainButton variant="primary">+ New obligation</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Student ID" name="studentId" required placeholder="uuid" />
        <TextField label="Fee assignment ID" name="assignmentId" required placeholder="uuid — student's existing student_fee_assignment" />
        <TextField label="Fee head ID (optional)" name="feeHeadId" placeholder="uuid" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Instalment no." name="instalmentNo" type="number" min="1" defaultValue="1" required />
          <TextField label="Amount (₹)" name="amountRupees" type="number" min="0" step="0.01" required />
        </div>
        <TextField label="Due date" name="dueDate" type="date" required />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Creating…">Create obligation</Button>
      </form>
    </Modal>
  );
}
