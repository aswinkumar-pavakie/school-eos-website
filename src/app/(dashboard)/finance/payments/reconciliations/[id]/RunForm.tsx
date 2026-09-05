"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { runReconciliationAction, type FormState } from "../actions";

const initial: FormState = {};

// No object-storage/file-parsing service exists yet — settlement rows are entered
// inline here rather than read back from an uploaded file (see Finance README).
export function RunForm({ id }: { id: string }) {
  const [state, formAction] = useActionState(runReconciliationAction.bind(null, id), initial);
  const [rows, setRows] = useState(1);
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Settlement rows</p>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          <TextField label="Gateway reference" name="gatewayRef" />
          <TextField label="Amount (₹)" name="amountRupees" type="number" min="0" step="0.01" />
        </div>
      ))}
      <button type="button" onClick={() => setRows((n) => n + 1)} className="self-start text-xs font-bold text-primary hover:underline">
        + Add another row
      </button>
      <FieldError message={state.error} />
      <Button variant="primary" pendingLabel="Running…" className="self-start">Run reconciliation</Button>
    </form>
  );
}
