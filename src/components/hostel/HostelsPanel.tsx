"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createHostelAction, type FormActionState } from "@/app/(dashboard)/admin/hostel/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { Field, PanelCreateForm, SelectField } from "./shared";

export interface Hostel {
  id: string;
  name: string;
  gender: string;
  capacity: number | null;
  status: string;
}

const initialState: FormActionState = {};

export function HostelsPanel({ hostels }: { hostels: Hostel[] }) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createHostelAction, initialState);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{hostels.length} hostels</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New hostel
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm title="New hostel" onCancel={() => setAdding(false)} formAction={formAction} isPending={isPending} error={state.error} submitLabel="Create">
          <Field label="Name" name="name" required disabled={isPending} placeholder="Block A Hostel" />
          <SelectField
            label="Gender"
            name="gender"
            required
            disabled={isPending}
            options={[
              ["", "Select"],
              ["MALE", "Male"],
              ["FEMALE", "Female"],
              ["MIXED", "Mixed"],
            ]}
          />
          <Field label="Capacity" name="capacity" type="number" disabled={isPending} />
        </PanelCreateForm>
      )}

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {hostels.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No hostels yet.</li>}
        {hostels.map((hostel) => (
          <li key={hostel.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="text-[13.5px] font-semibold text-text">{hostel.name}</p>
              <p className="text-xs text-text-muted">
                {hostel.gender.toLowerCase()}
                {hostel.capacity && ` · capacity ${hostel.capacity}`}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <StatusPill tone={hostel.status === "ACTIVE" ? "success" : "pending"} label={hostel.status} />
              <Link href={`/admin/hostel/${hostel.id}`} className="text-[13px] font-semibold text-primary">
                Open
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
