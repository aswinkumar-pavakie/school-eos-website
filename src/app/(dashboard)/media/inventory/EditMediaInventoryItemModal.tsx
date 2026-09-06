"use client";

import { useActionState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { FieldError } from "@/components/ui/EmptyState";
import type { MediaInventoryItem } from "@/lib/media-api";
import { updateMediaInventoryItemAction, type FormState } from "./actions";

const initial: FormState = {};

export function EditMediaInventoryItemModal({ item }: { item: MediaInventoryItem }) {
  const [state, formAction] = useActionState(updateMediaInventoryItemAction.bind(null, item.id), initial);
  return (
    <Modal title={`Edit ${item.name}`} trigger={<PlainButton variant="secondary" className="px-2.5 py-1 text-xs">Edit</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="Equipment name" name="name" defaultValue={item.name} required />
        <TextField label="Asset tag" name="assetCode" defaultValue={item.assetCode ?? ""} />
        <TextField label="Serial no. / description" name="description" defaultValue={item.description ?? ""} />
        <TextField label="Location" name="location" defaultValue={item.location ?? ""} />
        <TextField label="Vendor" name="vendor" defaultValue={item.vendor ?? ""} />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Saving…">Save changes</Button>
      </form>
    </Modal>
  );
}
