// Plain CSV -- opens natively in Excel/Sheets, no new dependency needed for a
// "download Excel" button. Quoting follows RFC 4180: a field is wrapped in
// quotes (with any internal quote doubled) whenever it contains a comma,
// quote, or newline.

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function rowsToCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const lines = [columns.map((c) => escapeCsvField(c.header)).join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsvField(String(c.value(row) ?? ""))).join(","));
  }
  // Leading BOM so Excel opens UTF-8 (₹, names with diacritics, etc.) correctly
  // instead of guessing the wrong codepage.
  return `﻿${lines.join("\r\n")}`;
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
