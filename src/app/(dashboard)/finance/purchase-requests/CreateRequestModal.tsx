"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlainButton, Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { Department } from "@/lib/finance-api";
import { createPurchaseRequestAction, type FormState } from "./actions";

const initial: FormState = {};

export function CreateRequestModal({ departments }: { departments: Department[] }) {
  const [state, formAction] = useActionState(createPurchaseRequestAction, initial);
  return (
    <Modal title="New request" trigger={<PlainButton variant="primary">+ New request</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <SelectField label="Type" name="requestType" required defaultValue="GOODS">
          <option value="GOODS">Purchase Request (goods)</option>
          <option value="SERVICE">Service Request</option>
        </SelectField>
        <TextField label="Item / service" name="itemName" required />
        <TextAreaField label="Description (optional)" name="description" rows={2} />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Quantity (optional)" name="quantity" type="number" min="1" step="1" />
          <TextField label="Estimated amount (₹, optional)" name="estimatedAmountRupees" type="number" min="0" step="0.01" />
        </div>
        <TextField label="Vendor (optional)" name="vendorName" />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Needed by (optional)" name="neededBy" type="date" />
          <SelectField label="Department (optional)" name="departmentId" defaultValue="">
            <option value="">—</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </SelectField>
        </div>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Submitting…">Submit request</Button>
      </form>
    </Modal>
  );
}
