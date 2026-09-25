// Shared "My Attendance" feature screen (personal biometric attendance) --
// the canonical pixel design ported from Faculty's own
// my-attendance/page.tsx + AttendanceMonthGrid.tsx, restyled to --eos-*
// tokens. Faculty's screen is the source of truth; Principal/Vice
// Principal's own real data source (getMyAttendanceHistory) has a slightly
// different shape (no separate ON_DUTY status, no punch-in/out times, only
// a single occurredAt timestamp) -- callers normalize their own shape into
// the props below rather than this component guessing at a shape it can't
// verify.

"use client";

import { useRouter } from "next/navigation";
import { MonthGrid } from "./MonthGrid";
import { StatTile } from "./StatTile";

export interface MyAttendanceDay {
  date: string; // YYYY-MM-DD
  status: "PRESENT" | "ABSENT" | "ON_DUTY" | null;
  /** Pre-formatted display line for the "Recent punches" row, e.g.
   * "08:42 in · 16:51 out" or "On duty · training at DAV" or "No punch
   * recorded" -- built by the caller since the two real data sources shape
   * this so differently (Faculty: punchIn/punchOut times; Principal/VP: a
   * single occurredAt + reason). */
  detailLine: string;
}

export function MyAttendanceView({
  basePath,
  subtitle,
  year,
  month,
  statTiles,
  todayLine,
  days,
}: {
  basePath: string;
  subtitle: string;
  year: number;
  month: number; // 0-indexed
  statTiles: { label: string; value: string }[];
  /** "Today" panel's single line, e.g. "PRESENT · In 08:42 · Out 16:51" or
   * "No event recorded yet today." */
  todayLine: string;
  days: MyAttendanceDay[];
}) {
  const router = useRouter();
  const dayByDate = new Map(days.map((d) => [d.date.slice(0, 10), d]));

  return (
    <div>
      <h1 style={{ margin: 0, font: "700 36px/1.1 var(--eos-font-sans)", letterSpacing: "-.02em", color: "var(--eos-ink)" }}>My attendance</h1>
      <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>{subtitle}</p>

      <div className="grid grid-cols-2 gap-[18px] lg:grid-cols-4" style={{ marginTop: 22 }}>
        {statTiles.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.2fr_1fr]" style={{ marginTop: 18, alignItems: "start" }}>
        <div style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: 22 }}>
          <MonthGrid
            year={year}
            month={month}
            onMonthChange={(ny, nm) => router.push(`${basePath}${basePath.includes("?") ? "&" : "?"}month=${ny}-${String(nm + 1).padStart(2, "0")}`)}
            renderCell={(date) => {
              // Local getters, not toISOString() -- this Date is built from
              // local year/month/day by MonthGrid, and toISOString() (UTC)
              // shifts it back a calendar day in any timezone ahead of UTC
              // (e.g. IST), silently mapping each cell to the WRONG real
              // attendance record (confirmed live: cell "25" showed the 24th's
              // real PRESENT status).
              const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
              const d = dayByDate.get(iso);
              const bg = d?.status === "PRESENT" ? "var(--eos-tint)" : d?.status === "ABSENT" ? "var(--eos-red-bg)" : d?.status ? "var(--eos-panel)" : "transparent";
              const fg = d?.status === "PRESENT" ? "var(--eos-primary)" : d?.status === "ABSENT" ? "var(--eos-red-text)" : "var(--eos-body)";
              return (
                <div style={{ height: 52, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", font: "500 14px/1 var(--eos-font-sans)", background: bg, color: fg }}>
                  {date.getDate()}
                </div>
              );
            }}
          />
          <div className="flex flex-wrap gap-4.5" style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--eos-divider)" }}>
            {[
              { label: "Present", bg: "var(--eos-tint)" },
              { label: "Absent", bg: "var(--eos-red-bg)" },
              { label: "On duty / holiday", bg: "var(--eos-panel)" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2" style={{ font: "400 13.5px/1 var(--eos-font-sans)", color: "#475569" }}>
                <span style={{ width: 16, height: 16, borderRadius: 5, border: "1px solid var(--eos-border)", background: l.bg }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: 22 }}>
          <h3 style={{ margin: "0 0 10px", font: "700 21px/1.2 var(--eos-font-sans)", color: "var(--eos-ink)" }}>Today</h3>
          <p style={{ font: "400 14px/1.5 var(--eos-font-sans)", color: todayLine.startsWith("No ") ? "var(--eos-tertiary)" : "var(--eos-body)" }}>{todayLine}</p>
          <h3 style={{ margin: "20px 0 10px", font: "700 21px/1.2 var(--eos-font-sans)", color: "var(--eos-ink)" }}>Recent punches</h3>
          {days.slice(0, 8).map((d) => (
            <div key={d.date} className="flex items-center gap-4" style={{ padding: "14px 0", borderBottom: "1px solid var(--eos-divider)" }}>
              <span style={{ width: 64, font: "500 13.5px/1.3 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>
                {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", font: "600 14.5px/1.3 var(--eos-font-sans)", color: "var(--eos-ink)" }}>{d.detailLine}</span>
              </span>
              {d.status && (
                <span style={{ font: "600 11px/1 var(--eos-font-sans)", letterSpacing: ".06em", borderRadius: 20, padding: "7px 12px", background: d.status === "PRESENT" ? "var(--eos-tint)" : d.status === "ABSENT" ? "var(--eos-red-bg)" : "var(--eos-panel)", color: d.status === "PRESENT" ? "var(--eos-primary)" : d.status === "ABSENT" ? "var(--eos-red-text)" : "var(--eos-body)" }}>
                  {d.status.replace(/_/g, " ")}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
