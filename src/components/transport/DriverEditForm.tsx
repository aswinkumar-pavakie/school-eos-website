"use client";

// Real driver master-record edit -- `PATCH /drivers/:id` grants
// TRANSPORT_MANAGER alongside ADMIN. Pixel-matched to the mockup's own
// "Crew details" popup (Transport Module.dc.html's `driver` form config:
// title/sub, 3x3 field grid) via the shared FormModal shell.
//
// "Assigned bus" stays real but read-only -- see updateDriverMasterAction's
// own comment for why reassigning a driver to a different vehicle isn't
// safe to do from this form (it already has a correct dedicated flow
// elsewhere). "Attendant" is real and editable -- swaps the real
// vehicle_route_assignment's attendantId, the same write EditCrewForm.tsx
// already performs on the bus detail page. "Attendant mobile" is a real,
// derived, read-only field (the selected attendant's own phone) -- there's
// no real attendant-record edit endpoint anywhere in this app, so it's never
// editable here.

import { useActionState, useEffect, useState } from "react";
import { updateDriverMasterAction, type FormActionState } from "@/app/(dashboard)/transport-manager/actions";
import { FormModal, ModalField, ModalSelect, ModalFooter } from "./FormModal";

const initialState: FormActionState = {};

export function DriverEditForm({
  driverId,
  assignmentId,
  fullName,
  phone,
  licenceNo,
  licenceExpiry,
  experienceYears,
  bloodGroup,
  vehicleRegNo,
  currentAttendantId,
  attendants,
  triggerClassName,
  triggerLabel,
}: {
  driverId: string;
  assignmentId: string | null;
  fullName: string;
  phone: string | null;
  licenceNo: string;
  licenceExpiry: string;
  experienceYears: number | null;
  bloodGroup: string | null;
  vehicleRegNo: string | null;
  currentAttendantId: string | null;
  attendants: { id: string; fullName: string; phone: string | null }[];
  triggerClassName: string;
  triggerLabel: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [selectedAttendantId, setSelectedAttendantId] = useState(currentAttendantId ?? "");
  const [state, formAction, isPending] = useActionState(updateDriverMasterAction.bind(null, driverId, assignmentId), initialState);

  useEffect(() => {
    if (!isPending && !state.error && state !== initialState) setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isPending]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {triggerLabel}
      </button>
    );
  }

  const selectedAttendantPhone = attendants.find((a) => a.id === selectedAttendantId)?.phone ?? "";

  return (
    <FormModal title="Crew details" subtitle="driver, licence and attendant" onClose={() => setOpen(false)}>
      {state.error && (
        <p className="mt-4 rounded-[10px] px-3.5 py-2.5 text-[13px]" style={{ background: "#DBEAFE", color: "#1E3A8A" }}>
          {state.error}
        </p>
      )}
      <form action={formAction} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
        <ModalField label="Driver name" name="fullName" disabled={isPending} defaultValue={fullName} />
        <ModalField label="Driver mobile" name="phone" disabled={isPending} defaultValue={phone ?? undefined} />
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.07em]" style={{ color: "#64748B" }}>
            Assigned bus
          </span>
          <input
            disabled
            readOnly
            title="Reassigning this driver to a different bus is done from Routes' own “Assign bus” or the bus detail page's “Edit route”, not here"
            value={vehicleRegNo ?? "—"}
            className="rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none"
            style={{ border: "1px solid #E2E8F0", color: "#64748B", background: "#F8FAFC" }}
          />
        </div>

        <ModalField label="Licence no" name="licenceNo" disabled={isPending} defaultValue={licenceNo} />
        <ModalField label="Licence valid till" name="licenceExpiry" type="date" disabled={isPending} defaultValue={licenceExpiry.slice(0, 10)} />
        <ModalField label="Experience (years)" name="experienceYears" type="number" disabled={isPending} defaultValue={experienceYears ?? undefined} />

        <ModalSelect
          label="Blood group"
          name="bloodGroup"
          disabled={isPending}
          defaultValue={bloodGroup ?? ""}
          options={[
            ["", "Not recorded"],
            ["A+", "A+"],
            ["A-", "A-"],
            ["B+", "B+"],
            ["B-", "B-"],
            ["AB+", "AB+"],
            ["AB-", "AB-"],
            ["O+", "O+"],
            ["O-", "O-"],
          ]}
        />
        {assignmentId ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.07em]" style={{ color: "#64748B" }}>
              Attendant
            </span>
            <select
              name="attendantId"
              disabled={isPending}
              value={selectedAttendantId}
              onChange={(e) => setSelectedAttendantId(e.target.value)}
              className="rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none transition-colors focus:border-primary disabled:opacity-60"
              style={{ border: "1px solid #E2E8F0", color: "#0F172A" }}
            >
              <option value="">None</option>
              {attendants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.07em]" style={{ color: "#64748B" }}>
              Attendant
            </span>
            <input
              disabled
              readOnly
              title="This driver has no current bus assignment to pair an attendant with"
              value="—"
              className="rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none"
              style={{ border: "1px solid #E2E8F0", color: "#64748B", background: "#F8FAFC" }}
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.07em]" style={{ color: "#64748B" }}>
            Attendant mobile
          </span>
          <input
            disabled
            readOnly
            title="No real attendant-record edit endpoint exists in this app -- this mirrors the selected attendant's own real phone number"
            value={selectedAttendantPhone || "—"}
            className="rounded-[10px] px-3.5 py-2.5 text-[14px] outline-none"
            style={{ border: "1px solid #E2E8F0", color: "#64748B", background: "#F8FAFC" }}
          />
        </div>

        <ModalFooter onClose={() => setOpen(false)} isPending={isPending} submitLabel="Save crew" />
      </form>
    </FormModal>
  );
}
