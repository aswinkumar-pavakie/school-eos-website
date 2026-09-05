"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlainButton, Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { formatMoneySummary } from "@/lib/format";
import type { FeeHead, StudentFeeAssignment } from "@/lib/finance-api";
import { createObligationAction, type FormState } from "./actions";

const initial: FormState = {};

// For the genuine one-off case (2.2: "a late admission fee, a specific fine") — the
// student must already have a student_fee_assignment row; this doesn't create one.
// Both the student and their fee assignment are picked from one real dropdown (one
// assignment IS one student) — never a raw UUID typed from memory.
export function CreateObligationModal({ assignments, feeHeads }: { assignments: StudentFeeAssignment[]; feeHeads: FeeHead[] }) {
  const [state, formAction] = useActionState(createObligationAction, initial);
  return (
    <Modal title="Create obligation" trigger={<PlainButton variant="primary">+ New obligation</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <SelectField label="Student" name="assignmentAndStudent" required defaultValue="">
          <option value="" disabled>Select…</option>
          {assignments.map((a) => (
            <option key={a.id} value={`${a.id}|${a.studentId}`}>
              {a.studentDisplayName ?? a.studentId.slice(0, 8)}
              {a.studentAdmissionNo ? ` (${a.studentAdmissionNo})` : ""} — owes {formatMoneySummary(a.netPaise)}
            </option>
          ))}
        </SelectField>
        <SelectField label="Fee head (optional)" name="feeHeadId" defaultValue="">
          <option value="">—</option>
          {feeHeads.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </SelectField>
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
