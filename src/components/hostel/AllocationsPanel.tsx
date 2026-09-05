"use client";

import { useActionState, useState } from "react";
import { createAllocationAction, vacateAllocationAction, type FormActionState } from "@/app/(dashboard)/admin/hostel/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate } from "@/lib/format";
import { Field, PanelCreateForm, SelectField } from "./shared";
import { UnallocatedStudentPicker, type UnallocatedStudent } from "./UnallocatedStudentPicker";

export interface Allocation {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  admissionNo: string;
  bedId: string;
  bedNo: string;
  roomNo: string;
  hostelName: string;
  academicYearId: string;
  allocatedFrom: string;
  allocatedTo: string | null;
  status: string;
}

const initialState: FormActionState = {};

const STATUS_OPTIONS: [string, string][] = [
  ["ACTIVE", "Active"],
  ["VACATED", "Vacated"],
  ["TRANSFERRED", "Transferred"],
];

export function AllocationsPanel({
  allocations,
  years,
  unallocatedStudents,
}: {
  allocations: Allocation[];
  years: { id: string; name: string; isCurrent: boolean }[];
  unallocatedStudents: UnallocatedStudent[];
}) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(createAllocationAction, initialState);
  const [statusFilter, setStatusFilter] = useState("");
  const yearName = (id: string) => years.find((y) => y.id === id)?.name ?? id;

  const filtered = statusFilter ? allocations.filter((a) => a.status === statusFilter) : allocations;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{allocations.length} allocations</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + New allocation
          </button>
        )}
      </div>

      {adding && (
        <PanelCreateForm title="New allocation" onCancel={() => setAdding(false)} formAction={formAction} isPending={isPending} error={state.error} submitLabel="Allocate">
          <UnallocatedStudentPicker students={unallocatedStudents} disabled={isPending} />
          <Field label="Bed ID" name="bedId" required disabled={isPending} placeholder="from a hostel's room" />
          <SelectField label="Academic year" name="academicYearId" required disabled={isPending} options={[["", "Select"], ...years.map((y): [string, string] => [y.id, y.name + (y.isCurrent ? " (current)" : "")])]} />
          <Field label="Allocated from" name="allocatedFrom" type="date" required disabled={isPending} />
        </PanelCreateForm>
      )}
      <p className="mt-2 text-xs text-text-muted">
        For drag-and-drop allocation with a visual room/bed picker, open a specific hostel instead — this form is the
        quick fallback when you already know the bed ID.
      </p>

      <div className="mt-4 flex items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Filter by status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {filtered.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No allocations match this filter.</li>}
        {filtered.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-text">
                {a.studentFirstName} {a.studentLastName ?? ""}
                <span className="ml-1.5 font-normal text-text-muted">· {a.admissionNo}</span>
              </p>
              <p className="truncate text-xs text-text-muted">
                {a.hostelName} · Room {a.roomNo} · Bed {a.bedNo}
              </p>
              <p className="text-xs text-text-muted">
                {yearName(a.academicYearId)} · From {formatDate(a.allocatedFrom)}
                {a.allocatedTo ? ` to ${formatDate(a.allocatedTo)}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <StatusPill tone={a.status === "ACTIVE" ? "success" : "pending"} label={a.status} />
              {a.status === "ACTIVE" && (
                <button type="button" onClick={() => vacateAllocationAction(a.id)} className="text-[13px] font-semibold text-critical-text">
                  Vacate
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
