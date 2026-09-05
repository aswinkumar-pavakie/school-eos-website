import type { ReactNode } from "react";

// Component #18 — data table (web only): sticky header, pinned first column,
// right-aligned numerics, row actions. Row density/pagination mechanics aren't
// specified by the design system beyond this, so kept simple/dense here.
export interface Column<T> {
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
}

export function DataTable<T>({ columns, rows, getKey }: { columns: Column<T>[]; rows: T[]; getKey: (row: T) => string }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead className="sticky top-0 bg-field">
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                className={`border-b border-border px-4 py-3 text-xs font-bold tracking-wide text-text-muted uppercase ${col.align === "right" ? "text-right" : "text-left"}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getKey(row)} className="border-b border-border last:border-0 hover:bg-field/60">
              {columns.map((col) => (
                <td key={col.header} className={`px-4 py-3 text-text ${col.align === "right" ? "text-right font-mono" : ""}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
