"use client";

// Real route-stop create + edit -- `POST /routes/:id/stops` and
// `PATCH /route-stops/:stopId` now grant TRANSPORT_MANAGER alongside ADMIN
// (explicit product decision this session). Create uses the mockup's own
// "Add stop to route" popup (Transport Module.dc.html line 999: 2-column
// modal, Stop name + Pickup time) via the shared FormModal shell -- a real
// "Sequence no" field is added alongside those two since this app's backend
// genuinely requires it explicitly (the mockup's own mock data just always
// inserts before the last stop, no equivalent real ordering input). Edit
// stays the existing inline-row form (matching RouteRow/VehicleSpecPanel's
// own established per-row edit pattern) rather than becoming a second modal.

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { createRouteStopAction, updateRouteStopAction, type FormActionState } from "@/app/(dashboard)/transport-manager/actions";
import { Field } from "./shared";
import { FormModal, ModalField, ModalFooter } from "./FormModal";

const initialState: FormActionState = {};

type CreateProps = {
  mode: "create";
  routeId: string;
  nextSequenceNo: number;
  triggerClassName: string;
  triggerLabel: ReactNode;
  /** Defaults to Transport Manager's own action. Admin's route detail page
   * passes its own (identical endpoint, revalidates /admin/transport/... instead). */
  createAction?: (routeId: string, prev: FormActionState, formData: FormData) => Promise<FormActionState>;
};
type EditProps = {
  mode: "edit";
  routeId: string;
  stopId: string;
  currentStopName: string;
  currentSequenceNo: number;
  currentScheduledTime: string | null;
  triggerClassName: string;
  triggerLabel: ReactNode;
  updateAction?: (stopId: string, routeId: string, prev: FormActionState, formData: FormData) => Promise<FormActionState>;
};

export function StopForm(props: CreateProps | EditProps) {
  const [open, setOpen] = useState(false);
  const action =
    props.mode === "create"
      ? (props.createAction ?? createRouteStopAction).bind(null, props.routeId)
      : (props.updateAction ?? updateRouteStopAction).bind(null, props.stopId, props.routeId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (!isPending && !state.error && state !== initialState) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={props.triggerClassName}>
        {props.triggerLabel}
      </button>
    );
  }

  if (props.mode === "create") {
    return (
      <FormModal title="Add stop to route" subtitle="inserted after the last stop on this route" onClose={() => setOpen(false)} maxWidthPx={640}>
        {state.error && (
          <p className="mt-4 rounded-[10px] px-3.5 py-2.5 text-[13px]" style={{ background: "#DBEAFE", color: "#1E3A8A" }}>
            {state.error}
          </p>
        )}
        <form action={formAction} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <ModalField label="Stop name" name="stopName" required disabled={isPending} />
          <ModalField label="Pickup time" name="scheduledTime" type="time" disabled={isPending} />
          <ModalField label="Sequence no" name="sequenceNo" type="number" required disabled={isPending} defaultValue={props.nextSequenceNo} />
          <ModalFooter onClose={() => setOpen(false)} isPending={isPending} submitLabel="Add stop" />
        </form>
      </FormModal>
    );
  }

  return (
    <div className="mt-3 w-full rounded-[11px] bg-field p-3.5">
      {state.error && <p className="mb-2.5 rounded-[9px] bg-critical-bg px-2.5 py-1.5 text-[12.5px] text-critical-text">{state.error}</p>}
      <form action={formAction} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Stop name" name="stopName" disabled={isPending} defaultValue={props.currentStopName} />
          <Field label="Sequence no." name="sequenceNo" type="number" disabled={isPending} defaultValue={props.currentSequenceNo} />
          <Field label="Pickup time" name="scheduledTime" type="time" disabled={isPending} defaultValue={props.currentScheduledTime ?? undefined} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-[10px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface">
            Cancel
          </button>
          <button type="submit" disabled={isPending} className="rounded-[10px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
