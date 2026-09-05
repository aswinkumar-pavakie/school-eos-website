"use client";

import { useActionState } from "react";
import { updateSchoolAction, type FormActionState } from "@/app/(dashboard)/admin/settings/actions";
import { Field, SelectField } from "./shared";

export interface School {
  id: number;
  name: string;
  code: string;
  board: string;
  schoolType: string;
  recognitionNo: string | null;
  stateSchoolCode: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  timezone: string;
  defaultLocale: string;
}

const initialState: FormActionState = {};

const SCHOOL_TYPES: [string, string][] = [
  ["GOVERNMENT", "Government"],
  ["AIDED", "Aided"],
  ["PARTIALLY_AIDED", "Partially aided"],
  ["PRIVATE_UNAIDED", "Private unaided"],
];

export function SchoolProfilePanel({ school }: { school: School }) {
  const [state, formAction, isPending] = useActionState(updateSchoolAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <p className="rounded-[11px] bg-critical-bg px-3.5 py-2.5 text-sm font-medium text-critical-text">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="School name" name="name" required disabled={isPending} defaultValue={school.name} />
        <Field label="Code" name="code" required disabled={isPending} defaultValue={school.code} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Board" name="board" required disabled={isPending} defaultValue={school.board} />
        <SelectField
          label="School type"
          name="schoolType"
          disabled={isPending}
          defaultValue={school.schoolType}
          options={SCHOOL_TYPES}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Recognition no." name="recognitionNo" disabled={isPending} defaultValue={school.recognitionNo ?? ""} />
        <Field label="State school code" name="stateSchoolCode" disabled={isPending} defaultValue={school.stateSchoolCode ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Address line 1" name="addressLine1" disabled={isPending} defaultValue={school.addressLine1 ?? ""} />
        <Field label="Address line 2" name="addressLine2" disabled={isPending} defaultValue={school.addressLine2 ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="City" name="city" disabled={isPending} defaultValue={school.city ?? ""} />
        <Field label="District" name="district" disabled={isPending} defaultValue={school.district ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="State" name="state" disabled={isPending} defaultValue={school.state ?? ""} />
        <Field label="Pincode" name="pincode" disabled={isPending} defaultValue={school.pincode ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contact phone" name="contactPhone" disabled={isPending} defaultValue={school.contactPhone ?? ""} />
        <Field label="Contact email" name="contactEmail" type="email" disabled={isPending} defaultValue={school.contactEmail ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Timezone" name="timezone" disabled={isPending} defaultValue={school.timezone} />
        <Field label="Default locale" name="defaultLocale" disabled={isPending} defaultValue={school.defaultLocale} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="mt-1 w-fit rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
