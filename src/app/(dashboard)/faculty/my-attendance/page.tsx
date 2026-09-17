// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isEmpAttendance"
// screen. Reuses EXISTING real getMyAttendance(month) data unchanged.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getMyAttendance } from "@/lib/faculty-staff-api";
import { StatTile } from "@/components/faculty-ui/StatTile";
import { AttendanceMonthGrid } from "./AttendanceMonthGrid";

function thisMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function MyAttendancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  try {
    const { month } = await searchParams;
    const selectedMonth = month || thisMonth();
    const [y, m] = selectedMonth.split("-").map(Number);
    const { today, summary, days } = await getMyAttendance(selectedMonth);
    const dayByDate = new Map(days.map((d) => [d.date.slice(0, 10), d]));

    return (
      <div>
        <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>My attendance</h1>
        <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>Your biometric log</p>

        <div className="grid grid-cols-2 gap-[18px] lg:grid-cols-4" style={{ marginTop: 22 }}>
          <StatTile label="Attendance rate" value={summary.ratePercent !== null ? `${summary.ratePercent}%` : "--"} />
          <StatTile label="Present" value={String(summary.presentCount)} />
          <StatTile label="Absent" value={String(summary.absentCount)} />
          <StatTile label="On duty" value={String(summary.onDutyCount)} />
        </div>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.2fr_1fr]" style={{ marginTop: 18, alignItems: "start" }}>
          <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 22 }}>
            <AttendanceMonthGrid year={y} month={m - 1} dayByDate={Object.fromEntries(dayByDate)} />
            <div className="flex flex-wrap gap-4.5" style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--fac-divider)" }}>
              {[
                { label: "Present", bg: "var(--fac-tint)" },
                { label: "Absent", bg: "var(--fac-red-bg)" },
                { label: "On duty / holiday", bg: "var(--fac-panel)" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2" style={{ font: "400 13.5px/1 var(--fac-font-sans)", color: "#475569" }}>
                  <span style={{ width: 16, height: 16, borderRadius: 5, border: "1px solid var(--fac-border)", background: l.bg }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 22 }}>
            <h3 style={{ margin: "0 0 10px", font: "700 21px/1.2 var(--fac-font-sans)" }}>Today</h3>
            {today.status ? (
              <p style={{ font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-body)" }}>
                {today.status}
                {today.punchIn ? ` · In ${today.punchIn}` : ""}
                {today.punchOut ? ` · Out ${today.punchOut}` : ""}
              </p>
            ) : (
              <p style={{ font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No event recorded yet today.</p>
            )}
            <h3 style={{ margin: "20px 0 10px", font: "700 21px/1.2 var(--fac-font-sans)" }}>Recent punches</h3>
            {days.slice(0, 8).map((d) => (
              <div key={d.date} className="fac-hover-lift flex items-center gap-4" style={{ padding: "14px 0", borderBottom: "1px solid var(--fac-divider)" }}>
                <span style={{ width: 64, font: "500 13.5px/1.3 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
                  {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", font: "600 14.5px/1.3 var(--fac-font-sans)" }}>{d.punchIn ?? "--"} {d.punchOut ? `- ${d.punchOut}` : ""}</span>
                </span>
                {d.status && (
                  <span style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".06em", borderRadius: 20, padding: "7px 12px", background: d.status === "PRESENT" ? "var(--fac-tint)" : "var(--fac-red-bg)", color: d.status === "PRESENT" ? "var(--fac-primary)" : "var(--fac-red-text)" }}>
                    {d.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your attendance. Nothing was changed -- try again." />;
  }
}
