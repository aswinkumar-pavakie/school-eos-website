"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { allocatePaymentAction, type FormState } from "../actions";

const initial: FormState = {};

export function AllocateForm({ paymentId }: { paymentId: string }) {
  const [state, formAction] = useActionState(allocatePaymentAction.bind(null, paymentId), initial);
  const [rows, setRows] = useState(1);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Allocate to obligations</p>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          <TextField label="Obligation ID" name="feeDemandId" placeholder="uuid" />
          <TextField label="Amount (₹)" name="amountRupees" type="number" min="0" step="0.01" />
        </div>
      ))}
      <button type="button" onClick={() => setRows((n) => n + 1)} className="self-start text-xs font-bold text-primary hover:underline">
        + Add another
      </button>
      <FieldError message={state.error} />
      <Button variant="primary" pendingLabel="Allocating…" className="self-start">Allocate</Button>
    </form>
  );
}
