"use client";

// The mockup's own "Export register" button (Transport Module.dc.html line
// 89, onClick={{ exportRegister }}) -- in the mockup itself this just logs to
// the mock data layer, no real file. Here it's wired to a real client-side
// CSV download of the real vehicle register already fetched server-side for
// this page -- no backend endpoint needed for a read-only export of data the
// page already has, and no fabricated columns (only real vehicle fields).

export interface ExportRegisterRow {
  registrationNo: string;
  model: string | null;
  capacity: number;
  ownership: string | null;
  operationalStatus: string;
}

function toCsv(rows: ExportRegisterRow[]): string {
  const header = ["Registration No", "Model", "Capacity", "Ownership", "Status"];
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = rows.map((r) =>
    [r.registrationNo, r.model ?? "", String(r.capacity), r.ownership ?? "", r.operationalStatus].map(escape).join(","),
  );
  return [header.join(","), ...lines].join("\r\n");
}

export function ExportRegisterButton({ rows, className }: { rows: ExportRegisterRow[]; className: string }) {
  function handleExport() {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vehicle-register-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" onClick={handleExport} className={className}>
      Export register
    </button>
  );
}
