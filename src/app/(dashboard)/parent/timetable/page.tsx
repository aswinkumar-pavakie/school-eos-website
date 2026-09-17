// Timetable -- pixel-rebuilt from the design's own isTimetable screen
// (Today view + Full week view). Real timetable_slot data (getTimetable).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getTimetable, listChildren, resolveSelectedChild } from "@/lib/parent-api";

const DAY_LABELS: Record<number, string> = { 1: "MON", 2: "TUE", 3: "WED", 4: "THU", 5: "FRI", 6: "SAT" };
const WEEK_DAYS = [1, 2, 3, 4, 5, 6];

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default async function ParentTimetablePage({ searchParams }: { searchParams: Promise<{ studentId?: string; view?: string; day?: string }> }) {
  try {
    const { studentId: requestedStudentId, view, day } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const { periods, slots } = await getTimetable(selected.studentId);
    const teachingPeriods = periods.filter((p) => !p.isBreak).sort((a, b) => a.periodNo - b.periodNo);

    const now = new Date();
    const todayDow = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const isFullWeek = view === "week";
    const selectedDay = day ? Number(day) : todayDow;

    const daySlots = slots.filter((s) => s.dayOfWeek === selectedDay).sort((a, b) => a.periodNo - b.periodNo);
    const periodsToday = daySlots.length;
    const freePeriods = teachingPeriods.length - periodsToday;
    const nowSlot = slots.find((s) => s.dayOfWeek === todayDow && nowMinutes >= toMinutes(s.startTime) && nowMinutes < toMinutes(s.endTime));

    return (
      <div className="parent-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6, color: "var(--par-ink)" }}>Timetable</div>
            <div style={{ fontSize: 15, color: "var(--par-body-muted)" }}>{selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join("-")}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={`/parent/timetable?studentId=${selected.studentId}`} style={{ textDecoration: "none" }}>
              <span style={{ display: "inline-block", borderRadius: 9, padding: "10px 18px", fontSize: 14, fontWeight: 700, background: !isFullWeek ? "var(--par-navy)" : "#fff", color: !isFullWeek ? "#fff" : "var(--par-ink)", border: !isFullWeek ? undefined : "1px solid var(--par-border)" }}>Today</span>
            </a>
            <a href={`/parent/timetable?studentId=${selected.studentId}&view=week`} style={{ textDecoration: "none" }}>
              <span style={{ display: "inline-block", borderRadius: 9, padding: "10px 18px", fontSize: 14, fontWeight: 700, background: isFullWeek ? "var(--par-navy)" : "#fff", color: isFullWeek ? "#fff" : "var(--par-ink)", border: isFullWeek ? undefined : "1px solid var(--par-border)" }}>Full week</span>
            </a>
          </div>
        </div>

        {!isFullWeek ? (
          <div>
            <div style={{ background: "var(--par-primary)", borderRadius: 16, padding: "22px 24px", marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 14 }}>{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
                {WEEK_DAYS.map((d) => (
                  <a key={d} href={`/parent/timetable?studentId=${selected.studentId}&day=${d}`} style={{ textDecoration: "none" }}>
                    <div style={{ borderRadius: 12, padding: "12px 0", textAlign: "center", background: d === selectedDay ? "#fff" : "rgba(255,255,255,0.12)", color: d === selectedDay ? "var(--par-primary)" : "#fff" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", opacity: 0.85 }}>{DAY_LABELS[d]}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 16, marginBottom: 20 }}>
              <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>Periods {selectedDay === todayDow ? "today" : ""}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--par-ink)" }}>{periodsToday}</div>
              </div>
              <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>Free periods</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--par-ink)" }}>{Math.max(0, freePeriods)}</div>
              </div>
              <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>Now</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--par-primary)" }}>{nowSlot?.subjectName ?? "—"}</div>
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, overflow: "hidden" }}>
              {daySlots.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "var(--par-tertiary)", fontSize: 14 }}>No periods scheduled this day.</div>}
              {daySlots.map((p) => {
                const isNow = selectedDay === todayDow && nowMinutes >= toMinutes(p.startTime) && nowMinutes < toMinutes(p.endTime);
                return (
                  <div key={p.slotId} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid var(--par-divider)" }}>
                    <div style={{ width: 70, flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--par-primary)" }}>{p.startTime.slice(0, 5)}</div>
                      <div style={{ fontSize: 11, color: "var(--par-tertiary)" }}>P{p.periodNo}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--par-ink)" }}>{p.subjectName}</div>
                      <div style={{ fontSize: 12, color: "var(--par-body-muted)" }}>{p.teacherName ?? "—"}</div>
                    </div>
                    {isNow && <span style={{ fontSize: 11, fontWeight: 700, background: "var(--par-primary)", color: "#fff", padding: "4px 10px", borderRadius: 20, flexShrink: 0 }}>NOW</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", padding: "16px 20px", borderBottom: "1px solid var(--par-border)" }}>Period</th>
                  {WEEK_DAYS.map((d) => (
                    <th key={d} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", padding: "16px 20px", borderBottom: "1px solid var(--par-border)" }}>{DAY_LABELS[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teachingPeriods.map((p) => (
                  <tr key={p.periodId}>
                    <td style={{ padding: "16px 20px", borderBottom: "1px solid var(--par-divider)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--par-primary)" }}>P{p.periodNo}</div>
                      <div style={{ fontSize: 11, color: "var(--par-tertiary)" }}>{p.startTime.slice(0, 5)}</div>
                    </td>
                    {WEEK_DAYS.map((d) => {
                      const slot = slots.find((s) => s.dayOfWeek === d && s.periodId === p.periodId);
                      return (
                        <td key={d} style={{ padding: "16px 20px", borderBottom: "1px solid var(--par-divider)" }}>
                          {slot ? (
                            <>
                              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--par-ink)" }}>{slot.subjectName}</div>
                              <div style={{ fontSize: 12, color: "var(--par-body-muted)" }}>{slot.teacherName ?? "—"}</div>
                            </>
                          ) : (
                            <div style={{ fontSize: 12, color: "var(--par-tertiary)" }}>Free</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the timetable."} />;
  }
}
