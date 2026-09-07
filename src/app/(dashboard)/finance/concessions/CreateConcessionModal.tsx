"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlainButton, Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { CONCESSION_TYPES } from "@/lib/finance-constants";
import { createConcessionAction, type FormState } from "./actions";

const initial: FormState = {};

// amountPaise/percent is a strict XOR (concession_amount_or_pct) — the "kind" radio
// makes that structural rather than letting both/neither be filled in.
export function CreateConcessionModal({ defaultStudentId, defaultOpen }: { defaultStudentId?: string; defaultOpen?: boolean } = {}) {
  const [state, formAction] = useActionState(createConcessionAction, initial);
  const [kind, setKind] = useState<"amount" | "percent">("percent");

  return (
    <Modal title="Create concession" trigger={<PlainButton variant="primary">+ New concession</PlainButton>} defaultOpen={defaultOpen}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Student ID" name="studentId" required placeholder="uuid" defaultValue={defaultStudentId} readOnly={!!defaultStudentId} />
        <TextField label="Academic year ID" name="academicYearId" required placeholder="uuid" />
        <SelectField label="Concession type" name="concessionType" defaultValue={CONCESSION_TYPES[0]}>
          {CONCESSION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </SelectField>

        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="kind" value="percent" checked={kind === "percent"} onChange={() => setKind("percent")} /> Percent
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="kind" value="amount" checked={kind === "amount"} onChange={() => setKind("amount")} /> Fixed amount
          </label>
        </div>
        {kind === "percent" ? (
          <TextField label="Percent" name="percent" type="number" min="0" max="100" step="0.01" required />
        ) : (
          <TextField label="Amount (₹)" name="amountRupees" type="number" min="0" step="0.01" required />
        )}

        <TextAreaField label="Reason" name="reason" required rows={3} />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Creating…">Create concession</Button>
      </form>
    </Modal>
  );
}
