"use client";

// Read-only -- write operations (create fee structures, edit lines, publish)
// live in the dedicated Finance/Accounts login being built separately; Admin
// only needs visibility here. Revisit once that module is in place.

import Link from "next/link";
import { AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatMoneySummary } from "@/lib/format";

export interface FeeStructure {
  id: string;
  academicYearId: string;
  gradeId: string;
  mediumId: string | null;
  category: string | null;
  totalPaise: string;
  state: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

export interface Grade {
  id: string;
  name: string;
}

export interface Medium {
  id: string;
  name: string;
}

const STATE_TABS: { value: string | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending approval" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUPERSEDED", label: "Superseded" },
];

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "ACTIVE") return "success";
  if (state === "SUPERSEDED") return "critical";
  return "pending";
}

export function FeeStructuresPanel({
  feeStructures,
  academicYears,
  grades,
  filters,
}: {
  feeStructures: FeeStructure[];
  academicYears: AcademicYear[];
  grades: Grade[];
  mediums: Medium[];
  filters: { academicYearId?: string; gradeId?: string; state?: string };
}) {
  const gradeById = new Map(grades.map((g) => [g.id, g.name]));
  const yearById = new Map(academicYears.map((y) => [y.id, y.name]));

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    if (filters.academicYearId) next.set("academicYearId", filters.academicYearId);
    if (filters.gradeId) next.set("gradeId", filters.gradeId);
    if (filters.state) next.set("state", filters.state);
    next.set("tab", "structures");
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    }
    return `/admin/finance?${next.toString()}`;
  }

  return (
    <div>
      <p className="text-[13px] text-text-muted">{feeStructures.length} fee structures</p>

      <form action="/admin/finance" className="mt-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="tab" value="structures" />
        <AutoSubmitSelect
          name="academicYearId"
          defaultValue={filters.academicYearId ?? ""}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          <option value="">All academic years</option>
          {academicYears.map((y) => (
            <option key={y.id} value={y.id}>
              {y.name}
            </option>
          ))}
        </AutoSubmitSelect>
        <AutoSubmitSelect
          name="gradeId"
          defaultValue={filters.gradeId ?? ""}
          className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
        >
          <option value="">All grades</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </AutoSubmitSelect>
        {filters.state && <input type="hidden" name="state" value={filters.state} />}
      </form>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {STATE_TABS.map((tab) => {
          const active = (filters.state ?? undefined) === tab.value;
          return (
            <Link
              key={tab.label}
              href={hrefWith({ state: tab.value })}
              className={`whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                active ? "bg-primary text-white" : "bg-field text-text-muted hover:bg-border"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 overflow-x-auto rounded-[16px] border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
              <th className="px-4 py-3">Academic year</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {feeStructures.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                  No fee structures match this filter.
                </td>
              </tr>
            )}
            {feeStructures.map((fs) => (
              <tr key={fs.id}>
                <td className="px-4 py-3 font-semibold text-text">{yearById.get(fs.academicYearId) ?? "—"}</td>
                <td className="px-4 py-3 text-text-muted">{gradeById.get(fs.gradeId) ?? "—"}</td>
                <td className="px-4 py-3 text-text-muted">{fs.category ?? "General"}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-text">{formatMoneySummary(fs.totalPaise)}</td>
                <td className="px-4 py-3">
                  <StatusPill tone={stateTone(fs.state)} label={fs.state.replace(/_/g, " ")} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/finance/${fs.id}`} className="text-[13px] font-semibold text-primary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
