"use client";

import { SecondaryButton } from "./primitives";

function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

// A real client-side export of whatever real rows this page already fetched
// and rendered -- no server-side report/PDF pipeline exists anywhere in the
// sports backend, so this saves exactly what's on screen as a CSV, the same
// honest convention already used by the dashboard's own
// ExportDaySheetButton and the Hostel Warden Reports page. Reused across
// every Sports Admin register screen's "Export"/"Print .../"Stock audit"/
// "Term statement" secondary button instead of duplicating this per page.
export function ExportCsvButton({
  label = "Export",
  filename,
  headers,
  rows,
}: {
  label?: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <SecondaryButton
      type="button"
      onClick={() => {
        const csvRows: (string | number)[][] = [headers, ...rows];
        const blob = new Blob([toCsv(csvRows)], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }}
      disabled={rows.length === 0}
    >
      {label}
    </SecondaryButton>
  );
}
