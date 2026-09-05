"use client";

// Inventory items filter row -- search + Category + Location, auto-submitting
// (no Apply button), same pattern as StudentsFilterBar. Status is a set of
// top-level tabs on the page itself (like the Students status tabs), not in
// this row.

import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";

interface Category {
  id: string;
  name: string;
}

export function InventoryFilterBar({
  search,
  categoryId,
  location,
  status,
  categories,
}: {
  search: string;
  categoryId: string;
  location: string;
  status?: string;
  categories: Category[];
}) {
  return (
    <form action="/admin/inventory" className="mt-6 flex flex-wrap items-end gap-3">
      {status && <input type="hidden" name="status" value={status} />}
      <AutoSubmitSearchInput
        type="search"
        name="search"
        defaultValue={search}
        placeholder="Search by name or asset code…"
        className="w-full max-w-md rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      />
      <AutoSubmitSelect
        name="categoryId"
        defaultValue={categoryId}
        className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
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
