"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlainButton, Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { OFFLINE_PAYMENT_MODES, ONLINE_PAYMENT_MODES } from "@/lib/finance-constants";
import { createPaymentAction, type FormState } from "./actions";

const initial: FormState = {};

export function CreatePaymentModal() {
  const [state, formAction] = useActionState(createPaymentAction, initial);
  const [mode, setMode] = useState<string>("CASH");
  const isOnline = (ONLINE_PAYMENT_MODES as string[]).includes(mode);

  return (
    <Modal title="Record payment" trigger={<PlainButton variant="primary">+ Record payment</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <SelectField label="Mode" name="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
          <optgroup label="Recorded directly by Finance">
            {OFFLINE_PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </optgroup>
          <optgroup label="Gateway-mediated (creates an intent, confirmed by webhook)">
            {ONLINE_PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </optgroup>
        </SelectField>
        {isOnline && <TextField label="Gateway" name="gateway" required placeholder="e.g. RAZORPAY" />}
        <TextField label="Amount (₹)" name="amountRupees" type="number" min="0" step="0.01" required />
        <TextField label="Paid by (person ID, optional)" name="paidByPersonId" placeholder="uuid" />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Recording…">
          {isOnline ? "Create payment intent" : "Record payment"}
        </Button>
      </form>
    </Modal>
  );
}
