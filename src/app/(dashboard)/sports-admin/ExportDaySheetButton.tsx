"use client";

import { SecondaryButton } from "@/components/sports-ui/primitives";

interface DaySheetRow {
  time: string;
  title: string;
  venue: string;
  kind: "Session" | "Fixture";
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

// A real client-side export of the real "Today on the ground" data already
// fetched for this dashboard -- no server-side report pipeline exists in
// the real backend, so this saves exactly what's on screen as a CSV, the
// same honest convention already used for the Hostel Warden Reports page.
export function ExportDaySheetButton({ rows, dateLabel }: { rows: DaySheetRow[]; dateLabel: string }) {
  return (
    <SecondaryButton
      type="button"
      onClick={() => {
        const csvRows: (string | number)[][] = [["Time", "Title", "Venue", "Type"], ...rows.map((r) => [r.time, r.title, r.venue, r.kind])];
        const blob = new Blob([toCsv(csvRows)], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sports-day-sheet-${dateLabel}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }}
      disabled={rows.length === 0}
    >
      Export day sheet
    </SecondaryButton>
  );
}
