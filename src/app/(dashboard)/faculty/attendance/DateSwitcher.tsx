"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MonthGrid, useMonthGridState } from "@/components/faculty-ui/MonthGrid";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// Matches the design's "Change date" ghost button revealing a month-calendar
// panel (built on the shared MonthGrid primitive) -- picking a day navigates
// to ?date=YYYY-MM-DD, the existing page.tsx's own query-param contract.
export function DateSwitcher({ sectionId, date }: { sectionId: string; date: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const selected = new Date(date);
  const { year, month, setMonth } = useMonthGridState(selected);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fac-hover-lift"
        style={{ border: "1px solid var(--fac-border)", background: "var(--fac-white)", cursor: "pointer", font: "600 14px/1 var(--fac-font-sans)", color: "var(--fac-navy)", borderRadius: 9, padding: "12px 18px" }}
      >
        {date === todayIso() ? "Change date" : new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 52,
            zIndex: 30,
            width: 320,
            background: "var(--fac-white)",
            border: "1px solid var(--fac-border)",
            borderRadius: "var(--fac-radius-card)",
            padding: 20,
            boxShadow: "var(--fac-shadow-popover)",
          }}
        >
          <MonthGrid
            year={year}
            month={month}
            onMonthChange={setMonth}
            renderCell={(d) => {
              // Local getters, not toISOString() -- this Date is built from
              // local year/month/day by MonthGrid, and toISOString() (UTC)
              // shifts it back a calendar day in any timezone ahead of UTC
              // (e.g. IST), so a click would navigate to the wrong ?date=.
              const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              const isSelected = iso === date;
              return (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(`?sectionId=${sectionId}&date=${iso}`);
                  }}
                  style={{
                    height: 40,
                    width: "100%",
                    border: 0,
                    borderRadius: 9,
                    cursor: "pointer",
                    font: isSelected ? "600 14px/1 var(--fac-font-sans)" : "400 14px/1 var(--fac-font-sans)",
                    background: isSelected ? "var(--fac-primary)" : "transparent",
                    color: isSelected ? "#fff" : "var(--fac-ink)",
                  }}
                >
                  {d.getDate()}
                </button>
              );
            }}
          />
          <p style={{ font: "400 13px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)", textAlign: "center", marginTop: 14 }}>
            Pick a date to see that day&rsquo;s attendance
          </p>
        </div>
      )}
    </div>
  );
}
