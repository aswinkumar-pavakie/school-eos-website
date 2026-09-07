// Plain <a> to a Route Handler that streams the full (unpaginated) filtered
// list as CSV -- Excel/Sheets open a .csv natively, so this is the "download
// Excel" button without adding an xlsx-generation dependency. A real browser
// download, not a client-side Blob trick, so it needs no "use client".

export function ExportCsvLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-semibold text-text hover:bg-bg"
    >
      Download Excel (.csv)
    </a>
  );
}
