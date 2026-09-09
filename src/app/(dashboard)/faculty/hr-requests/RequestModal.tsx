"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { createHrRequestAction, type FormState } from "./actions";

const initial: FormState = {};
const CATEGORIES = [
  { value: "SALARY_QUERY", label: "Salary query" },
  { value: "PF_ESI", label: "PF / ESI" },
  { value: "INCOME_TAX_DECLARATION", label: "Income tax declaration" },
  { value: "INCREMENT_ARREARS", label: "Increment / arrears" },
  { value: "BANK_ACCOUNT_CHANGE", label: "Bank account change" },
  { value: "SERVICE_CERTIFICATE", label: "Service certificate" },
];

export function RequestModal() {
  const [state, formAction] = useActionState(createHrRequestAction, initial);
  return (
    <Modal title="New HR request" trigger={<PlainButton variant="primary">+ New request</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <SelectField label="Category" name="category" defaultValue={CATEGORIES[0]!.value}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </SelectField>
        <TextField label="Subject" name="subject" required minLength={2} />
        <TextAreaField label="Description (optional)" name="description" rows={3} />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Submitting…">Submit request</Button>
      </form>
    </Modal>
  );
}
