"use client";

// Students -- Transport Manager's read-only search over the real
// student_transport_allocation data already fetched server-side (via each
// route's own /routes/:id/assigned-students, same endpoint Route detail
// uses) -- never a second, invented student directory. Client-side
// search/filter only, no extra network round-trip, since the whole dataset
// (every currently-transported student) is small enough to fetch once.

import { useMemo, useState } from "react";
import { StatusPill } from "@/components/dashboard/StatusPill";

export interface TransportStudentRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  admissionNo: string;
  gradeName: string | null;
  sectionName: string | null;
  routeId: string;
  routeName: string;
  routeStopId: string;
  stopName: string;
  direction: string;
  status: string;
}

function tone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "CANCELLED") return "critical";
  return "pending";
}

export function TransportStudentsTable({
  students,
  routes,
}: {
  students: TransportStudentRow[];
  routes: { id: string; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (routeFilter && s.routeId !== routeFilter) return false;
      if (!q) return true;
      const name = `${s.studentFirstName} ${s.studentLastName ?? ""}`.toLowerCase();
      const classLabel = `${s.gradeName ?? ""} ${s.sectionName ?? ""}`.toLowerCase();
      return (
        name.includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        classLabel.includes(q) ||
        s.stopName.toLowerCase().includes(q)
      );
    });
  }, [students, search, routeFilter, statusFilter]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Search</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, admission no, class, or stop…"
            className="w-64 rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Route</span>
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            <option value="">All routes</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="CHANGED">Changed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <p className="pb-2.5 text-[13px] text-text-muted">{filtered.length} of {students.length}</p>
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {filtered.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No students match this filter.</li>}
        {filtered.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="text-[13.5px] font-semibold text-text">
                {s.studentFirstName} {s.studentLastName ?? ""}
              </p>
              <p className="text-xs text-text-muted">
                {s.admissionNo}
                {s.gradeName ? ` · ${s.gradeName}${s.sectionName ? `-${s.sectionName}` : ""}` : ""}
                {" · "}
                {s.routeName} · Stop: {s.stopName} · {s.direction.toLowerCase()}
              </p>
            </div>
            <StatusPill tone={tone(s.status)} label={s.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
