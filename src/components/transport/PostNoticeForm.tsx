"use client";

// Real "Post a notice" -- `POST /announcements` grants TRANSPORT_MANAGER
// alongside ADMIN/PRINCIPAL (explicit product decision). Pixel-matched to
// the mockup's own "notice" popup (Transport Module.dc.html's `notice` form
// config: title/sub, cols:'1fr 2fr' -- Tag narrow, Notice wide) via the
// shared FormModal shell, plus real "Bus no" and "Route" fields the user
// explicitly asked for on top of the mockup's own two -- both real dropdowns
// of actual vehicles/routes, not free text.

import { useActionState, useEffect, useState } from "react";
import { createNoticeAction, type FormActionState } from "@/app/(dashboard)/transport-manager/actions";
import { FormModal, ModalField, ModalSelect, ModalFooter } from "./FormModal";

const initialState: FormActionState = {};

export function PostNoticeForm({
  vehicles,
  routes,
  triggerClassName,
}: {
  vehicles: { id: string; registrationNo: string }[];
  routes: { id: string; name: string; code: string | null }[];
  triggerClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createNoticeAction, initialState);

  useEffect(() => {
    if (!isPending && !state.error && state !== initialState) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        New
      </button>
    );
  }

  return (
    <FormModal title="Post a notice" subtitle="shown on the transport dashboard" onClose={() => setOpen(false)} maxWidthPx={720}>
      {state.error && (
        <p className="mt-4 rounded-[10px] px-3.5 py-2.5 text-[13px]" style={{ background: "#DBEAFE", color: "#1E3A8A" }}>
          {state.error}
        </p>
      )}
      <form action={formAction} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
        <ModalSelect
          label="Bus no"
          name="busNo"
          disabled={isPending}
          options={[["", "None"], ...vehicles.map((v): [string, string] => [v.registrationNo, v.registrationNo])]}
        />
        <ModalSelect
          label="Route"
          name="routeLabel"
          disabled={isPending}
          options={[["", "None"], ...routes.map((r): [string, string] => [r.code ?? r.name, r.code ?? r.name])]}
        />
        <ModalField label="Tag" name="tag" disabled={isPending} defaultValue="ROUTE" />
        <ModalField label="Notice" name="notice" required disabled={isPending} />
        <ModalFooter onClose={() => setOpen(false)} isPending={isPending} submitLabel="Post notice" />
      </form>
    </FormModal>
  );
}
