"use client";

import { useActionState, useState } from "react";
import {
  closeAcademicYearAction,
  createAcademicYearAction,
  setCurrentAcademicYearAction,
  updateAcademicYearAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/academics/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate } from "@/lib/format";
import { Field, PanelCreateForm, PanelHeader, SelectField } from "./shared";

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
  closedAt: string | null;
}

const initialState: FormActionState = {};

function tone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "CLOSED" || status === "ARCHIVED") return "critical";
  return "pending";
}

export function AcademicYearsPanel({ years }: { years: AcademicYear[] }) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createAcademicYearAction, initialState);

  return (
    <div>
      <PanelHeader
        title="Academic years"
        subtitle={`${years.length} academic year${years.length === 1 ? "" : "s"}`}
        actionLabel="+ New academic year"
        onAction={() => setAdding(true)}
        hideAction={adding}
      />

      {adding && (
        <PanelCreateForm
          title="New academic year"
          onCancel={() => setAdding(false)}
          formAction={formAction}
          isPending={isPending}
          error={state.error}
          submitLabel="Create"
        >
          <Field label="Name" name="name" required disabled={isPending} placeholder="2026-2027" />
          <Field label="Start date" name="startDate" type="date" required disabled={isPending} />
          <Field label="End date" name="endDate" type="date" required disabled={isPending} />
        </PanelCreateForm>
      )}

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {years.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No academic years yet.</li>}
        {years.map((year) => (
          <YearRow key={year.id} year={year} />
        ))}
      </ul>
    </div>
  );
}

function YearRow({ year }: { year: AcademicYear }) {
  const [editing, setEditing] = useState(false);
  const action = updateAcademicYearAction.bind(null, year.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const canSetCurrent = !year.isCurrent && year.status !== "CLOSED" && year.status !== "ARCHIVED";

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text">
            {year.name} {year.isCurrent && <span className="text-primary">· current</span>}
          </p>
          <p className="text-xs text-text-muted">
            {formatDate(year.startDate)} – {formatDate(year.endDate)}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={tone(year.status)} label={year.status} />
          {canSetCurrent && (
            <button
              type="button"
              onClick={() => setCurrentAcademicYearAction(year.id)}
              className="text-[13px] font-semibold text-primary"
            >
              Set current
            </button>
          )}
          <button type="button" onClick={() => setEditing((v) => !v)} className="text-[13px] font-semibold text-primary">
            {editing ? "Cancel" : "Edit"}
          </button>
          {year.status === "ACTIVE" && (
            <button
              type="button"
              onClick={() => closeAcademicYearAction(year.id)}
              className="text-[13px] font-semibold text-critical-text"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {editing && (
        <form action={formAction} className="flex flex-col gap-2.5 rounded-[11px] bg-field p-3">
          {state.error && <p className="text-xs text-critical-text">{state.error}</p>}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Field label="Name" name="name" disabled={isPending} defaultValue={year.name} />
            <Field label="Start date" name="startDate" type="date" disabled={isPending} defaultValue={year.startDate?.slice(0, 10)} />
            <Field label="End date" name="endDate" type="date" disabled={isPending} defaultValue={year.endDate?.slice(0, 10)} />
            <SelectField
              label="Status"
              name="status"
              disabled={isPending || year.status === "CLOSED" || year.status === "ARCHIVED"}
              defaultValue={year.status}
              options={[
                ["PLANNED", "Planned"],
                ["ACTIVE", "Active"],
              ]}
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-fit rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
    </li>
  );
}
