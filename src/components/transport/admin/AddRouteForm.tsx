"use client";

// Real "+ Add route" on Admin's Transport landing page -- not part of any of
// the 9 reference screenshots (which only ever show existing routes), but
// Admin genuinely has POST /routes access (createRouteAction, already used by
// the old Transport tabs this page replaces) with nowhere left to reach it
// from once the old tabs are gone. Added per the user's own "if admin needs
// any other extra features implement them" instruction -- real endpoint,
// real write, not a mockup guess.

import { useActionState, useEffect, useState } from "react";
import { createRouteAction, type FormActionState } from "@/app/(dashboard)/admin/transport/actions";
import { FormModal, ModalField, ModalSelect, ModalFooter } from "@/components/transport/FormModal";

const initialState: FormActionState = {};

export function AddRouteForm({ triggerClassName }: { triggerClassName: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createRouteAction, initialState);

  useEffect(() => {
    if (!isPending && !state.error && state !== initialState) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        + Add route
      </button>
    );
  }

  return (
    <FormModal title="Add route" subtitle="new route, no stops yet" onClose={() => setOpen(false)} maxWidthPx={640}>
      {state.error && (
        <p className="mt-4 rounded-[10px] px-3.5 py-2.5 text-[13px]" style={{ background: "#DBEAFE", color: "#1E3A8A" }}>
          {state.error}
        </p>
      )}
      <form action={formAction} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <ModalField label="Route name" name="name" required disabled={isPending} />
        <ModalField label="Code" name="code" disabled={isPending} />
        <ModalSelect
          label="Direction"
          name="direction"
          disabled={isPending}
          defaultValue="BOTH"
          options={[
            ["BOTH", "Both"],
            ["PICKUP", "Pickup"],
            ["DROP", "Drop"],
          ]}
        />
        <ModalField label="Distance (km)" name="distanceKm" type="number" disabled={isPending} />
        <ModalFooter onClose={() => setOpen(false)} isPending={isPending} submitLabel="Add route" />
      </form>
    </FormModal>
  );
}
