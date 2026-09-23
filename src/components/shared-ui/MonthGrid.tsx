"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

// Shared, role-agnostic month grid -- identical logic to faculty-ui/
// MonthGrid.tsx, restyled to --eos-* (the site-wide shared design tokens,
// see globals.css) instead of --fac-*, so it renders pixel-identically
// inside any role's dashboard, not only Faculty's own faculty-theme.css
// scope. Every shared-ui feature component that needs a month calendar
// (Academic Calendar today; My Attendance's own punch calendar) uses this
// one primitive.
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthGrid({
  year,
  month,
  onMonthChange,
  renderCell,
  headerNote,
}: {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  renderCell: (date: Date) => ReactNode;
  headerNote?: string;
}) {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const daysInMonth = monthEnd.getDate();
  const leadingBlanks = monthStart.getDay();

  function change(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    onMonthChange(y, m);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => change(-1)}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-[7px]"
          style={{ border: "1px solid var(--eos-border)", color: "var(--eos-body-muted)" }}
        >
          <ChevronLeftIcon />
        </button>
        <div style={{ textAlign: "center" }}>
          <p style={{ font: "700 17px/1.2 var(--eos-font-sans)", color: "var(--eos-ink)" }}>
            {MONTH_NAMES[month]} {year}
          </p>
          {headerNote && <p style={{ font: "400 12px/1 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>{headerNote}</p>}
        </div>
        <button
          type="button"
          onClick={() => change(1)}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-[7px]"
          style={{ border: "1px solid var(--eos-border)", color: "var(--eos-body-muted)" }}
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div
        className="mt-3 grid grid-cols-7 gap-1.5 text-center"
        style={{ font: "600 11px/1 var(--eos-font-sans)", letterSpacing: ".09em", color: "var(--eos-tertiary)" }}
      >
        {WEEKDAY_HEADERS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => (
          <div key={i}>{renderCell(new Date(year, month, i + 1))}</div>
        ))}
      </div>
    </div>
  );
}

/** Convenience hook so callers don't each re-derive today's year/month. */
export function useMonthGridState(initial?: Date) {
  const base = initial ?? new Date();
  const [year, setYear] = useState(base.getFullYear());
  const [month, setMonth] = useState(base.getMonth());
  return { year, month, setMonth: (y: number, m: number) => { setYear(y); setMonth(m); } };
}
