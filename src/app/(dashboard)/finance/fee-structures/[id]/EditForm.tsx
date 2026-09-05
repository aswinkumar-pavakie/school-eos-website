"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { FeeHead, FeeStructure, FeeStructureLine } from "@/lib/finance-api";
import { updateFeeStructureAction, type FormState } from "../actions";

const initial: FormState = {};

/** Only ever rendered for a DRAFT structure (the backend itself locks any other
 * state) — replaces the whole line set, so every existing line pre-fills a row. */
export function EditForm({ structure, lines, feeHeads }: { structure: FeeStructure; lines: FeeStructureLine[]; feeHeads: FeeHead[] }) {
  const [state, formAction] = useActionState(updateFeeStructureAction.bind(null, structure.id), initial);
  const [lineKeys, setLineKeys] = useState<number[]>(lines.length > 0 ? lines.map((_, i) => i) : [0]);
  const nextKey = useRef(lineKeys.length);

  function addLine() {
    setLineKeys((keys) => [...keys, nextKey.current++]);
  }
  function removeLine(key: number) {
    setLineKeys((keys) => (keys.length > 1 ? keys.filter((k) => k !== key) : keys));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Edit fee structure</p>
      <TextField label="Category (optional)" name="category" defaultValue={structure.category ?? ""} placeholder="e.g. General" />

      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold tracking-wide text-text-muted uppercase">Fee lines</p>
        {lineKeys.map((key, i) => {
          const line = lines[i];
          return (
            <div key={key} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
              <SelectField label="Fee head" name="lineFeeHeadId" required defaultValue={line?.feeHeadId ?? ""}>
                <option value="" disabled>Select…</option>
                {feeHeads.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </SelectField>
              <TextField
                label="Amount (₹)"
                name="lineAmountRupees"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={line ? (Number(line.amountPaise) / 100).toString() : undefined}
              />
              <TextField label="Due date" name="lineDueDate" type="date" required defaultValue={line?.dueDate.slice(0, 10)} />
              <button
                type="button"
                onClick={() => removeLine(key)}
                disabled={lineKeys.length === 1}
                aria-label="Remove this fee line"
                className="rounded-[var(--radius-input)] border border-border px-3 py-2.5 text-sm font-bold text-critical-text hover:bg-critical-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                ✕
              </button>
            </div>
          );
        })}
        <button type="button" onClick={addLine} className="self-start text-xs font-bold text-primary hover:underline">
          + Add another line
        </button>
      </div>

      <FieldError message={state.error} />
      <Button variant="secondary" pendingLabel="Saving…" className="self-start">Save changes</Button>
    </form>
  );
}
