"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { receivePaymentAction, type FormState } from "./actions";

const initial: FormState = {};

export interface DemandOption {
  feeDemandId: string;
  label: string;
  balancePaise: string;
}

// Shared by the "Receive Payment" tab's Quick Actions and the "Education Loan DD"
// tab's "Add DD" action — same underlying action, `defaultMode` just pre-selects DD
// for the latter (still switchable, since a DD payment IS just mode=DD on the same
// receive-payment call — no separate schema/endpoint exists for it, see backend README).
export function ReceivePaymentModal({
  studentId,
  demandOptions,
  trigger,
  defaultMode = "CASH",
}: {
  studentId: string;
  demandOptions: DemandOption[];
  trigger: React.ReactNode;
  defaultMode?: "CASH" | "CHEQUE" | "DD";
}) {
  const [state, formAction] = useActionState(receivePaymentAction.bind(null, studentId), initial);
  const [mode, setMode] = useState<string>(defaultMode);

  return (
    <Modal title="Receive Payment" trigger={trigger}>
      <form action={formAction} className="flex flex-col gap-4">
        <p className="text-xs text-text-muted">Record a real fee payment against a student&apos;s obligation.</p>

        <SelectField label="Obligation" name="feeDemandId" required defaultValue="">
          <option value="" disabled>Select…</option>
          {demandOptions.map((d) => <option key={d.feeDemandId} value={d.feeDemandId}>{d.label}</option>)}
        </SelectField>

        <div className="grid grid-cols-2 gap-3">
          <TextField label="Amount (₹)" name="amountRupees" type="number" min="0" step="0.01" required />
          <SelectField label="Mode" name="mode" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="DD">DD (Education Loan)</option>
          </SelectField>
        </div>

        {mode === "DD" && (
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Bank name" name="bankName" required placeholder="e.g. HDFC Bank" />
            <TextField label="DD reference no." name="ddReferenceNo" required placeholder="e.g. DD2025000441" />
          </div>
        )}

        <FieldError message={state.error} />
        {state.success && <p className="text-xs font-medium text-success-text">{state.success}</p>}
        <Button variant="primary" pendingLabel="Recording…">Record Payment</Button>
      </form>
    </Modal>
  );
}
