"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlainButton, Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { FEE_HEAD_TYPES } from "@/lib/finance-constants";
import { createFeeHeadAction, type FormState } from "./actions";

const initial: FormState = {};

export function CreateFeeHeadModal() {
  const [state, formAction] = useActionState(createFeeHeadAction, initial);
  return (
    <Modal title="Add fee structure item" trigger={<PlainButton variant="primary">+ Add fee structure item</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Name" name="name" required placeholder="e.g. Library Fee" />
        <TextField label="Code" name="code" required placeholder="e.g. LIBRARY" />
        <SelectField label="Head type" name="headType" defaultValue={FEE_HEAD_TYPES[0]}>
          {FEE_HEAD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </SelectField>
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="isRefundable" value="true" /> Refundable
        </label>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Creating…">Create</Button>
      </form>
    </Modal>
  );
}
