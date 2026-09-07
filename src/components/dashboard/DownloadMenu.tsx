"use client";

// Replaces the old plain ExportCsvLink everywhere it was used (Inventory,
// Maintenance, Finance overview/payments, Reports, Attendance, Academic
// Calendar, Students, Faculty, Parents) -- one blue "Download" button with a
// dropdown offering the two real formats already established elsewhere in this
// app: Excel (.csv), a genuine file download; PDF, which opens the same
// print-ready report used by every existing "Print / PDF" link in this app
// (its own page has a real "Print / Save as PDF" button -- window.print(), the
// browser's own Save-as-PDF, exactly how PDF already works everywhere here,
// not a new mechanism invented for this button).

import { useEffect, useRef, useState } from "react";

export function DownloadMenu({ csvHref, pdfHref }: { csvHref: string; pdfHref: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-[11px] bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"
      >
        Download
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-48 overflow-hidden rounded-[11px] border border-border bg-surface py-1 shadow-lg">
          <a
            href={csvHref}
            className="block px-3.5 py-2 text-sm font-semibold text-text hover:bg-bg"
            onClick={() => setOpen(false)}
          >
            Excel (.csv)
          </a>
          <a
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3.5 py-2 text-sm font-semibold text-text hover:bg-bg"
            onClick={() => setOpen(false)}
          >
            PDF
          </a>
        </div>
      )}
    </div>
  );
}
