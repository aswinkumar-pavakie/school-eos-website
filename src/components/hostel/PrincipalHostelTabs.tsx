"use client";

// Principal's read-only Hostel oversight -- same 2 top-level areas as Admin's
// own Hostel tabs (Hostels/Allocations), same data, built fresh rather than
// reusing HostelsPanel/AllocationsPanel verbatim: those panels embed
// create/vacate forms and Admin-only server actions inline. Only Admin can
// create hostels/blocks/floors/rooms/beds or allocate/vacate a student --
// Hostel operational management stays with Admin; Principal gets the same
// oversight visibility, no write controls.

import Link from "next/link";
import { useState } from "react";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate } from "@/lib/format";
import type { Hostel } from "./HostelsPanel";
import type { Allocation } from "./AllocationsPanel";

const TABS = ["Hostels", "Allocations"] as const;
type Tab = (typeof TABS)[number];

const STATUS_OPTIONS: [string, string][] = [
  ["ACTIVE", "Active"],
  ["VACATED", "Vacated"],
  ["TRANSFERRED", "Transferred"],
];

export function PrincipalHostelTabs({
  hostels,
  allocations,
  years,
}: {
  hostels: Hostel[];
  allocations: Allocation[];
  years: { id: string; name: string; isCurrent: boolean }[];
}) {
  const [tab, setTab] = useState<Tab>("Hostels");
  const [statusFilter, setStatusFilter] = useState("");
  const yearName = (id: string) => years.find((y) => y.id === id)?.name ?? id;

  const filteredAllocations = statusFilter ? allocations.filter((a) => a.status === statusFilter) : allocations;

  return (
    <div>
      <div className="mt-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              tab === t ? "bg-primary text-white" : "bg-field text-text-muted hover:bg-border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-[16px] border border-border bg-surface p-[18px]">
        {tab === "Hostels" && (
          <div>
            <p className="text-[13px] text-text-muted">{hostels.length} hostels</p>
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
                    <Link href={`/principal/hostel/${hostel.id}`} className="text-[13px] font-semibold text-primary">
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "Allocations" && (
          <div>
            <p className="text-[13px] text-text-muted">{allocations.length} allocations</p>
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
              {filteredAllocations.length === 0 && (
                <li className="py-6 text-center text-sm text-text-muted">No allocations match this filter.</li>
              )}
              {filteredAllocations.map((a) => (
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
                  <StatusPill tone={a.status === "ACTIVE" ? "success" : "pending"} label={a.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
