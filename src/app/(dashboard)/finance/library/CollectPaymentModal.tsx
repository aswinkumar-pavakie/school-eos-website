"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { collectLibraryFinePaymentAction, type FormState } from "./actions";

const initial: FormState = {};

export function CollectPaymentModal({ receivableId, balancePaise }: { receivableId: string; balancePaise: string }) {
  const [state, formAction] = useActionState(collectLibraryFinePaymentAction.bind(null, receivableId), initial);

  return (
    <Modal title="Collect payment" trigger={<PlainButton variant="primary" className="px-2.5 py-1 text-xs">Collect payment</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <p className="text-xs text-text-muted">Balance outstanding on this Library fine.</p>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Amount (₹)" name="amountRupees" type="number" min="0" step="0.01" required defaultValue={(Number(BigInt(balancePaise)) / 100).toFixed(2)} />
          <SelectField label="Mode" name="mode" defaultValue="CASH">
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="DD">DD</option>
            <option value="ONLINE">Online</option>
          </SelectField>
        </div>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Collecting…">Collect payment</Button>
      </form>
    </Modal>
  );
}
