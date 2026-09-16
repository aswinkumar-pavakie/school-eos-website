"use client";

import { SecondaryButton } from "@/components/hostel-warden-ui/primitives";

function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

// A real client-side export of the real data already fetched for this
// screen -- no server-side report pipeline exists in the real backend, so
// this never claims to be a "scheduled" or "generated" report; it just saves
// what's on screen as a CSV file, which is genuinely useful and genuinely
// real (unlike the design's own decorative "downloaded" toast).
export function DownloadCsvButton({ filename, rows }: { filename: string; rows: (string | number)[][] }) {
  return (
    <SecondaryButton
      type="button"
      style={{ height: 32, fontSize: 12.5 }}
      onClick={() => {
        const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }}
    >
      Download CSV
    </SecondaryButton>
  );
}
