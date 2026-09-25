// Attendance -- pixel-rebuilt from the design's own isAttendance screen.
// Real attendance_record data (getAttendance), month-navigable via a real
// ?month= query param.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getAttendance, listChildren, resolveSelectedChild } from "@/lib/parent-api";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function parseMonthKey(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  PRESENT: { bg: "#fff", fg: "var(--par-ink)" },
  ABSENT: { bg: "var(--par-primary-strong)", fg: "#fff" },
  HOLIDAY: { bg: "var(--par-divider)", fg: "var(--par-tertiary)" },
  LATE: { bg: "var(--par-amber-bg)", fg: "var(--par-amber)" },
  HALF_DAY: { bg: "var(--par-amber-bg)", fg: "var(--par-amber)" },
};

export default async function ParentAttendancePage({ searchParams }: { searchParams: Promise<{ studentId?: string; month?: string }> }) {
  try {
    const { studentId: requestedStudentId, month } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const cursor = month ? parseMonthKey(month) : new Date();
    const currentMonthKey = monthKey(cursor);
    const prevMonthKey = monthKey(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
    const nextMonthKey = monthKey(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

    const { summary, days } = await getAttendance(selected.studentId, currentMonthKey);

    const dayByDate = new Map(days.map((d) => [new Date(d.date).getDate(), d.status]));
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const startDow = monthStart.getDay();

    const cells: { day: number | null; status: string | null }[] = [];
    for (let i = 0; i < startDow; i++) cells.push({ day: null, status: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, status: dayByDate.get(d) ?? null });

    const presentDays = days.filter((d) => d.status === "PRESENT").length;
    const absentDays = days.filter((d) => d.status === "ABSENT").length;
    const lateDays = days.filter((d) => d.status === "LATE").length;

    return (
      <div className="parent-scope">
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: "var(--par-ink)" }}>Attendance</div>
        <div style={{ fontSize: 14, color: "var(--par-body-muted)", marginBottom: 24 }}>{selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join("-")}</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, alignItems: "start" }}>
          <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: "var(--par-primary-strong)", lineHeight: 1 }}>{summary.percentage}%</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--par-ink)" }}>
                  {summary.presentCount}<span style={{ fontSize: 14, fontWeight: 600, color: "var(--par-tertiary-2)" }}> / {summary.totalCount}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--par-tertiary-2)" }}>days present</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: "var(--par-body)", marginBottom: 12 }}>{cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
            <div style={{ position: "relative", height: 10, background: "var(--par-divider)", borderRadius: 5, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ width: `${summary.percentage}%`, height: "100%", background: "var(--par-primary-strong)", borderRadius: 5 }} />
              <div style={{ position: "absolute", top: 0, left: "85%", width: 3, height: "100%", background: "#fff" }} />
            </div>
            <div style={{ fontSize: 13, color: "var(--par-tertiary-2)" }}>Marker shows the 85% requirement</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, marginTop: 20 }}>
              <div style={{ background: "var(--par-panel-2)", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--par-ink)" }}>{presentDays}</div>
                <div style={{ fontSize: 12, color: "var(--par-tertiary-2)" }}>Present</div>
              </div>
              <div style={{ background: "var(--par-panel-2)", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--par-ink)" }}>{absentDays}</div>
                <div style={{ fontSize: 12, color: "var(--par-tertiary-2)" }}>Absent</div>
              </div>
              <div style={{ background: "var(--par-panel-2)", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--par-ink)" }}>{lateDays}</div>
                <div style={{ fontSize: 12, color: "var(--par-tertiary-2)" }}>Late arrivals</div>
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
              <Link href={`/parent/attendance?studentId=${selected.studentId}&month=${prevMonthKey}`}>
                <span style={{ display: "flex", width: 38, height: 38, borderRadius: "50%", background: "var(--par-tint)", color: "var(--par-primary-strong)", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>‹</span>
              </Link>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: "var(--par-ink)" }}>{cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
                <div style={{ fontSize: 13, color: "var(--par-tertiary-2)" }}>{presentDays} present · {absentDays} absent</div>
              </div>
              <Link href={`/parent/attendance?studentId=${selected.studentId}&month=${nextMonthKey}`}>
                <span style={{ display: "flex", width: 38, height: 38, borderRadius: "50%", background: "var(--par-tint)", color: "var(--par-primary-strong)", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>›</span>
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 8, marginBottom: 8 }}>
              {WEEKDAYS.map((w) => (
                <div key={w} style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--par-tertiary)" }}>{w}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 8 }}>
              {cells.map((c, i) => {
                const style = c.status ? STATUS_STYLE[c.status] ?? STATUS_STYLE.HOLIDAY! : null;
                return (
                  <div
                    key={i}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      background: style?.bg ?? "transparent",
                      color: style?.fg ?? "var(--par-ink)",
                      border: c.day && c.status === "PRESENT" ? "1px solid var(--par-border)" : undefined,
                    }}
                  >
                    {c.day ?? ""}
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: "1px solid var(--par-divider)", paddingTop: 16, marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 16, height: 16, borderRadius: 5, background: "#fff", border: "1px solid var(--par-border)", display: "inline-block" }} />
                <span style={{ fontSize: 13, color: "var(--par-body)" }}>Present</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 16, height: 16, borderRadius: 5, background: "var(--par-primary-strong)", display: "inline-block" }} />
                <span style={{ fontSize: 13, color: "var(--par-body)" }}>Absent</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 16, height: 16, borderRadius: 5, background: "var(--par-divider)", display: "inline-block" }} />
                <span style={{ fontSize: 13, color: "var(--par-body)" }}>Holiday</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load attendance."} />;
  }
}
