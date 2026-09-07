"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { Concession } from "@/lib/finance-api";
import { updateConcessionAction, type FormState } from "../actions";

const initial: FormState = {};

// amountPaise/percent stays a strict XOR on edit too, same as on create.
export function EditForm({ concession }: { concession: Concession }) {
  const [state, formAction] = useActionState(updateConcessionAction.bind(null, concession.id), initial);
  const [kind, setKind] = useState<"amount" | "percent">(concession.percent ? "percent" : "amount");

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="kind" value="percent" checked={kind === "percent"} onChange={() => setKind("percent")} /> Percent
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="kind" value="amount" checked={kind === "amount"} onChange={() => setKind("amount")} /> Fixed amount
        </label>
      </div>
      {kind === "percent" ? (
        <TextField label="Percent" name="percent" type="number" min="0" max="100" step="0.01" defaultValue={concession.percent ?? ""} required />
      ) : (
        <TextField label="Amount (₹)" name="amountRupees" type="number" min="0" step="0.01" defaultValue={concession.amountPaise ? (Number(concession.amountPaise) / 100).toString() : ""} required />
      )}
      <TextAreaField label="Reason" name="reason" defaultValue={concession.reason} rows={3} required />
      <FieldError message={state.error} />
      <Button variant="secondary" pendingLabel="Saving…" className="self-start">Save changes</Button>
    </form>
  );
}
