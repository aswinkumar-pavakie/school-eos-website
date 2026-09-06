"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import { createMediaInventoryItemAction, type FormState } from "./actions";

const initial: FormState = {};

export function CreateMediaInventoryItemModal() {
  const [state, formAction] = useActionState(createMediaInventoryItemAction, initial);
  return (
    <Modal title="Add asset" trigger={<PlainButton variant="primary">+ Add asset</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Equipment name" name="name" required placeholder="e.g. Canon EOS 90D DSLR Camera" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Asset tag" name="assetCode" placeholder="e.g. MEDIA-CAM-001" />
          <TextField label="Serial no." name="description" placeholder="Recorded in the description" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Quantity" name="quantity" type="number" min="1" defaultValue="1" />
          <TextField label="Book value (₹)" name="acquisitionCostRupees" placeholder="1,25,000" />
        </div>
        <TextField label="Location" name="location" placeholder="Media room" />
        <TextField label="Vendor" name="vendor" />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Adding…">Add asset</Button>
      </form>
    </Modal>
  );
}
