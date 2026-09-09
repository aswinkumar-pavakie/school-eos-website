"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/EmptyState";
import { requestPayslipAccessAction, type FormState } from "./actions";

const initial: FormState = {};

export function RequestAccessButton() {
  const [state, formAction] = useActionState(requestPayslipAccessAction, initial);
  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <Button variant="primary" pendingLabel="Submitting…">Request payslip access</Button>
      <FieldError message={state.error} />
    </form>
  );
}
