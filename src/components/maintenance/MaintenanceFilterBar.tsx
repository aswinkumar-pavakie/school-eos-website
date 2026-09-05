"use client";

// Repair request filter row -- search + Priority + Issue type + Location,
// auto-submitting, same pattern as StudentsFilterBar/InventoryFilterBar. Status
// is a set of top-level tabs on the page itself.

import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";

const ISSUE_TYPES: [string, string][] = [
  ["ELECTRICAL", "Electrical"],
  ["PLUMBING", "Plumbing"],
  ["CIVIL", "Civil"],
  ["IT_EQUIPMENT", "IT equipment"],
  ["FURNITURE", "Furniture"],
  ["OTHER", "Other"],
];

export function MaintenanceFilterBar({
  search,
  priority,
  issueType,
  location,
  status,
}: {
  search: string;
  priority: string;
  issueType: string;
  location: string;
  status?: string;
}) {
  return (
    <form action="/admin/maintenance" className="mt-6 flex flex-wrap items-end gap-3">
      {status && <input type="hidden" name="status" value={status} />}
      <AutoSubmitSearchInput
        type="search"
        name="search"
        defaultValue={search}
        placeholder="Search by title or description…"
        className="w-full max-w-md rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      />
      <AutoSubmitSelect
        name="priority"
        defaultValue={priority}
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      >
        <option value="">All priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="URGENT">Urgent</option>
      </AutoSubmitSelect>
      <AutoSubmitSelect
        name="issueType"
        defaultValue={issueType}
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      >
        <option value="">All types</option>
        {ISSUE_TYPES.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </AutoSubmitSelect>
      <AutoSubmitSearchInput
        type="search"
        name="location"
        defaultValue={location}
        placeholder="Filter by location…"
        className="w-48 rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      />
    </form>
  );
}
