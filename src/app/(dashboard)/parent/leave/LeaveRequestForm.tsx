"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { createLeaveRequestAction, type FormState } from "./actions";

const initial: FormState = {};

export function LeaveRequestForm({ studentId }: { studentId: string }) {
  const [state, formAction] = useActionState(createLeaveRequestAction, initial);

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
      <h2 className="mb-1 text-sm font-bold text-text">Apply for leave</h2>
      <p className="mb-4 text-xs text-text-muted">Sent to the class teacher for approval.</p>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="studentId" value={studentId} required />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="From date" name="fromDate" type="date" required />
          <TextField label="To date" name="toDate" type="date" required />
        </div>
        <TextAreaField label="Reason" name="reason" rows={3} required />
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="skipSchoolTransport" className="h-4 w-4 rounded border-border" />
          Bus will not stop for these days — the driver and class teacher are informed
        </label>
        <FieldError message={state.error} />
        <div className="flex justify-end">
          <Button variant="primary" pendingLabel="Submitting…">Submit request</Button>
        </div>
      </form>
    </div>
  );
}
