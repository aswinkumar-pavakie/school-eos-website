"use client";

import { useActionState, useState } from "react";
import {
  createTerminalAction,
  updateTerminalAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/settings/actions";
import { Field, PanelCreateForm, SelectField } from "./shared";
import { StatusPill } from "@/components/dashboard/StatusPill";

export interface Terminal {
  id: string;
  terminalUid: string;
  terminalType: string;
  label: string;
  vehicleId: string | null;
  vendorId: string | null;
  authSecretRef: string;
  firmwareVersion: string | null;
  status: string;
}

export interface Vehicle {
  id: string;
  registrationNo: string;
}

const initialState: FormActionState = {};

const TERMINAL_TYPES: [string, string][] = [
  ["BUS", "Bus"],
  ["CANTEEN", "Canteen"],
  ["GATE", "Gate"],
  ["LIBRARY", "Library"],
];

const STATUS_OPTIONS: [string, string][] = [
  ["ACTIVE", "Active"],
  ["OFFLINE", "Offline"],
  ["FAULTY", "Faulty"],
  ["RETIRED", "Retired"],
];

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "FAULTY" || status === "RETIRED") return "critical";
  return "pending";
}

function TypeAwareFields({ terminal, vehicles }: { terminal?: Terminal; vehicles: Vehicle[] }) {
  const [terminalType, setTerminalType] = useState(terminal?.terminalType ?? "BUS");

  return (
    <>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">
          Terminal type<span className="text-critical-text"> *</span>
        </span>
        <select
          name="terminalType"
          required
          value={terminalType}
          onChange={(e) => setTerminalType(e.target.value)}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          {TERMINAL_TYPES.map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
      </label>
      {terminalType === "BUS" && (
        <SelectField
          label="Vehicle"
          name="vehicleId"
          required
          defaultValue={terminal?.vehicleId ?? ""}
          options={[["", "Select a vehicle"], ...vehicles.map((v): [string, string] => [v.id, v.registrationNo])]}
        />
      )}
      {terminalType === "CANTEEN" && (
        <Field label="Vendor ID" name="vendorId" required defaultValue={terminal?.vendorId ?? ""} />
      )}
    </>
  );
}

function EditTerminalRow({ terminal, vehicles }: { terminal: Terminal; vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);
  const boundAction = updateTerminalAction.bind(null, terminal.id);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <div className="border-t border-border px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-text">{terminal.label}</p>
          <p className="text-xs text-text-muted">
            {terminal.terminalUid} · {terminal.terminalType}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill tone={statusTone(terminal.status)} label={terminal.status} />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-[11px] border border-border px-3 py-1.5 text-xs font-bold text-text hover:bg-surface"
          >
            {open ? "Close" : "Manage"}
          </button>
        </div>
      </div>
      {open && (
        <PanelCreateForm
          title={`Edit ${terminal.label}`}
          onCancel={() => setOpen(false)}
          formAction={formAction}
          isPending={isPending}
          error={state.error}
          submitLabel="Save"
        >
          <Field label="Terminal UID" name="terminalUid" required defaultValue={terminal.terminalUid} />
          <Field label="Label" name="label" required defaultValue={terminal.label} />
          <TypeAwareFields terminal={terminal} vehicles={vehicles} />
          <Field label="Auth secret ref" name="authSecretRef" required defaultValue={terminal.authSecretRef} />
          <Field label="Firmware version" name="firmwareVersion" defaultValue={terminal.firmwareVersion ?? ""} />
          <SelectField label="Status" name="status" defaultValue={terminal.status} options={STATUS_OPTIONS} />
        </PanelCreateForm>
      )}
    </div>
  );
}

function CreateTerminalForm({ vehicles }: { vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createTerminalAction, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-fit rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white"
      >
        Register terminal
      </button>
    );
  }

  return (
    <PanelCreateForm
      title="New terminal"
      onCancel={() => setOpen(false)}
      formAction={formAction}
      isPending={isPending}
      error={state.error}
      submitLabel="Register"
    >
      <Field label="Terminal UID" name="terminalUid" required />
      <Field label="Label" name="label" required />
      <TypeAwareFields vehicles={vehicles} />
      <Field label="Auth secret ref" name="authSecretRef" required />
      <Field label="Firmware version" name="firmwareVersion" />
    </PanelCreateForm>
  );
}

export function TerminalsPanel({ terminals, vehicles }: { terminals: Terminal[]; vehicles: Vehicle[] }) {
  return (
    <div className="flex flex-col gap-4">
      <CreateTerminalForm vehicles={vehicles} />
      <div className="overflow-hidden rounded-[11px] border border-border">
        {terminals.length === 0 && <p className="px-3.5 py-6 text-center text-text-muted">No terminals found.</p>}
        {terminals.map((terminal) => (
          <EditTerminalRow key={terminal.id} terminal={terminal} vehicles={vehicles} />
        ))}
      </div>
    </div>
  );
}
