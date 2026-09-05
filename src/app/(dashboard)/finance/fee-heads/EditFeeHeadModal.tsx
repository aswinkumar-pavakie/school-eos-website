"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PlainButton, Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { FEE_HEAD_TYPES } from "@/lib/finance-constants";
import type { FeeHead } from "@/lib/finance-api";
import { updateFeeHeadAction, type FormState } from "./actions";

const initial: FormState = {};

export function EditFeeHeadModal({ feeHead }: { feeHead: FeeHead }) {
  const [state, formAction] = useActionState(updateFeeHeadAction.bind(null, feeHead.id), initial);
  return (
    <Modal title={`Edit ${feeHead.name}`} trigger={<PlainButton variant="secondary" className="px-2.5 py-1 text-xs">Edit</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Name" name="name" required defaultValue={feeHead.name} />
        <TextField label="Code" name="code" required defaultValue={feeHead.code} />
        <SelectField label="Head type" name="headType" defaultValue={feeHead.headType}>
          {FEE_HEAD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </SelectField>
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="isRefundable" value="true" defaultChecked={feeHead.isRefundable} /> Refundable
        </label>
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">Save changes</Button>
      </form>
    </Modal>
  );
}
