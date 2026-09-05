"use client";

import { useActionState, useState } from "react";
import {
  closeAcademicYearAction,
  createAcademicYearAction,
  setCurrentAcademicYearAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/academics/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate } from "@/lib/format";
import { Field, PanelCreateForm } from "./shared";

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
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{years.length} academic years</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New academic year
          </button>
        )}
      </div>

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
          <li key={year.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
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
              {!year.isCurrent && year.status !== "CLOSED" && year.status !== "ARCHIVED" && (
                <button
                  type="button"
                  onClick={() => setCurrentAcademicYearAction(year.id)}
                  className="text-[13px] font-semibold text-primary"
                >
                  Set current
                </button>
              )}
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
          </li>
        ))}
      </ul>
    </div>
  );
}
