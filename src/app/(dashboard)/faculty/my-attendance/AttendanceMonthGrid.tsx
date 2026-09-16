"use client";

import { useRouter } from "next/navigation";
import { MonthGrid } from "@/components/faculty-ui/MonthGrid";

export function AttendanceMonthGrid({
  year,
  month,
  dayByDate,
}: {
  year: number;
  month: number;
  dayByDate: Record<string, { status: string | null }>;
}) {
  const router = useRouter();
  return (
    <MonthGrid
      year={year}
      month={month}
      onMonthChange={(ny, nm) => router.push(`/faculty/my-attendance?month=${ny}-${String(nm + 1).padStart(2, "0")}`)}
      renderCell={(date) => {
        const iso = date.toISOString().slice(0, 10);
        const d = dayByDate[iso];
        const bg = d?.status === "PRESENT" ? "var(--fac-tint)" : d?.status === "ABSENT" ? "var(--fac-red-bg)" : d?.status ? "var(--fac-panel)" : "transparent";
        const fg = d?.status === "PRESENT" ? "var(--fac-primary)" : d?.status === "ABSENT" ? "var(--fac-red-text)" : "var(--fac-body)";
        return (
          <div style={{ height: 52, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", font: "500 14px/1 var(--fac-font-sans)", background: bg, color: fg }}>
            {date.getDate()}
          </div>
        );
      }}
    />
  );
}
