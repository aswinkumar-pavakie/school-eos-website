"use client";

// Create-request modal -- same shape as CreateStudentModal/CreateInventoryItemModal.
// When reached from an inventory item's own "+ New request" link, the item is
// preset (no picker shown) so the link the item creates a request without
// duplicating the item lookup.

import { useActionState, useState } from "react";
import { createRepairRequestAction, type FormActionState } from "@/app/(dashboard)/admin/maintenance/actions";
import { Field, SelectField, TextAreaField } from "@/components/dashboard/FormFields";
import { InventoryItemPicker } from "@/components/inventory/InventoryItemPicker";

const initialState: FormActionState = {};

const ISSUE_TYPES: [string, string][] = [
  ["ELECTRICAL", "Electrical"],
  ["PLUMBING", "Plumbing"],
  ["CIVIL", "Civil"],
  ["IT_EQUIPMENT", "IT equipment"],
  ["FURNITURE", "Furniture"],
  ["OTHER", "Other"],
];

export function CreateRepairRequestModal({
  presetItem,
  defaultOpen,
}: {
  presetItem?: { id: string; label: string };
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [item, setItem] = useState<{ id: string; name: string } | null>(null);
  const itemId = presetItem?.id ?? item?.id;
  const action = createRepairRequestAction.bind(null, itemId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,111,224,.25)] transition-opacity hover:opacity-90"
      >
        + New request
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#101828]/45 px-4 py-10">
          <div className="w-full max-w-[480px] rounded-[16px] bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">New repair request</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg"
              >
                ×
              </button>
            </div>

            {state.error && (
              <p role="alert" className="mt-4 rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm font-medium text-critical-text">
                {state.error}
              </p>
            )}

            <form
              action={(formData) => {
                formAction(formData);
                setOpen(false);
              }}
              className="mt-4 flex flex-col gap-4"
              noValidate
            >
              <Field label="Title" name="title" required disabled={isPending} placeholder="e.g. Broken chair in Room 12" />

              {presetItem ? (
                <p className="text-sm text-text">
                  Affected item: <span className="font-semibold">{presetItem.label}</span>
                </p>
              ) : (
                <InventoryItemPicker disabled={isPending} onSelect={setItem} />
              )}

              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Issue type" name="issueType" disabled={isPending} defaultValue="OTHER" options={ISSUE_TYPES} />
                <SelectField
                  label="Priority"
                  name="priority"
                  disabled={isPending}
                  defaultValue="MEDIUM"
                  options={[
                    ["LOW", "Low"],
                    ["MEDIUM", "Medium"],
                    ["HIGH", "High"],
                    ["URGENT", "Urgent"],
                  ]}
                />
              </div>

              <Field label="Location" name="location" disabled={isPending} placeholder="e.g. Room 12, Block A" />
              <TextAreaField label="Problem / damage description" name="description" required disabled={isPending} />
              <Field label="Request date" name="requestedOn" type="date" disabled={isPending} />

              <button
                type="submit"
                disabled={isPending}
                className="mt-2 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {isPending ? "Creating…" : "Create request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
