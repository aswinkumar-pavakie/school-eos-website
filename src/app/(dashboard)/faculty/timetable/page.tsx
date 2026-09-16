// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isTimetable"
// screen. Reuses EXISTING real getWeeklyTimetable() unchanged.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getWeeklyTimetable } from "@/lib/faculty-academics-api";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";

const DAY_LABELS: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };

function todayDow(): number {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 6 : jsDay;
}

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ view?: string; day?: string }> }) {
  try {
    const { view, day } = await searchParams;
    const isWeek = view === "week";
    const selectedDay = day ? Math.min(Math.max(Number(day), 1), 6) : Math.min(todayDow(), 6);
    const { periods, days } = await getWeeklyTimetable();
    const daySlots = new Map(days.find((d) => d.dayOfWeek === selectedDay)?.slots.map((s) => [s.periodId, s]) ?? []);
    const todayRows = periods.filter((p) => !p.isBreak).map((p) => ({ p, slot: daySlots.get(p.periodId) })).filter((r) => r.slot);
    const uniqueSubjects = new Set(todayRows.map((r) => r.slot!.subjectName)).size;

    return (
      <div>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Timetable</h1>
            <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>Your real weekly schedule</p>
          </div>
          <div style={{ display: "flex", background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: 10, padding: 4, gap: 4 }}>
            <a href="/faculty/timetable" style={{ border: 0, cursor: "pointer", borderRadius: 7, padding: "10px 20px", font: "600 14px/1 var(--fac-font-sans)", background: !isWeek ? "var(--fac-primary)" : "transparent", color: !isWeek ? "#fff" : "var(--fac-body)" }}>
              Today
            </a>
            <a href="/faculty/timetable?view=week" style={{ border: 0, cursor: "pointer", borderRadius: 7, padding: "10px 20px", font: "600 14px/1 var(--fac-font-sans)", background: isWeek ? "var(--fac-primary)" : "transparent", color: isWeek ? "#fff" : "var(--fac-body)" }}>
              Full week
            </a>
          </div>
        </div>

        {periods.length === 0 ? (
          <div style={{ marginTop: 22 }}>
            <FacultyEmptyState message="No periods are configured yet." />
          </div>
        ) : !isWeek ? (
          <div>
            <div style={{ background: "var(--fac-primary)", borderRadius: 14, padding: "20px 22px", marginTop: 22 }}>
              <div style={{ font: "600 14px/1 var(--fac-font-sans)", color: "var(--fac-tint)" }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div className="grid grid-cols-6 gap-3" style={{ marginTop: 14 }}>
                {[1, 2, 3, 4, 5, 6].map((d) => (
                  <a
                    key={d}
                    href={`/faculty/timetable?day=${d}`}
                    style={{ border: 0, cursor: "pointer", borderRadius: 10, padding: "14px 0", textAlign: "center", background: d === selectedDay ? "#fff" : "rgba(255,255,255,.15)", color: d === selectedDay ? "var(--fac-primary)" : "#fff", display: "block" }}
                  >
                    <span style={{ display: "block", font: "600 11.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", opacity: 0.85 }}>{DAY_LABELS[d]}</span>
                  </a>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" style={{ marginTop: 16 }}>
              {[
                { label: "PERIODS TODAY", value: String(todayRows.length) },
                { label: "SUBJECTS", value: String(uniqueSubjects) },
                { label: "FIRST PERIOD", value: todayRows[0]?.p.startTime.slice(0, 5) ?? "--" },
                { label: "LAST PERIOD", value: todayRows[todayRows.length - 1]?.p.endTime.slice(0, 5) ?? "--" },
              ].map((s) => (
                <div key={s.label} style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "16px 20px" }}>
                  <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)" }}>{s.label}</div>
                  <div style={{ font: "700 30px/1.1 var(--fac-font-sans)", marginTop: 9 }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2.5" style={{ marginTop: 16 }}>
              {periods.map((p) => {
                const slot = daySlots.get(p.periodId);
                return (
                  <div key={p.periodId} className="fac-hover-lift flex items-center gap-4.5" style={{ background: p.isBreak ? "var(--fac-panel)" : "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: 11, padding: "15px 20px" }}>
                    <div style={{ width: 56 }}>
                      <div className="fac-font-mono" style={{ font: "500 13.5px/1.2 var(--fac-font-mono)", color: "var(--fac-primary)" }}>{p.startTime.slice(0, 5)}</div>
                      <div className="fac-font-mono" style={{ font: "400 11.5px/1.3 var(--fac-font-mono)", color: "var(--fac-tertiary)" }}>P{p.periodNo}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {p.isBreak ? (
                        <div style={{ font: "600 15.5px/1.3 var(--fac-font-sans)", color: "var(--fac-body-muted)", fontStyle: "italic" }}>{p.label ?? "Break"}</div>
                      ) : slot ? (
                        <>
                          <div style={{ font: "600 15.5px/1.3 var(--fac-font-sans)" }}>{slot.subjectName}</div>
                          <div style={{ font: "400 13px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>{slot.gradeName} {slot.sectionName}</div>
                        </>
                      ) : (
                        <div style={{ font: "600 15.5px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Free · {p.label ?? `Period ${p.periodNo}`}</div>
                      )}
                    </div>
                    {slot?.room && (
                      <span style={{ font: "500 12.5px/1 var(--fac-font-sans)", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 7, padding: "7px 11px" }}>{slot.room}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", marginTop: 22, overflow: "auto" }}>
            <div className="grid" style={{ gridTemplateColumns: "90px repeat(6, minmax(130px, 1fr))", background: "var(--fac-panel)", borderBottom: "1px solid var(--fac-border)" }}>
              <div style={{ padding: "14px 16px", font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-body-muted)" }}>PERIOD</div>
              {[1, 2, 3, 4, 5, 6].map((d) => (
                <div key={d} style={{ padding: "14px 16px", font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-body-muted)" }}>{DAY_LABELS[d]}</div>
              ))}
            </div>
            {periods.map((p) => (
              <div key={p.periodId} className="fac-hover-lift grid" style={{ gridTemplateColumns: "90px repeat(6, minmax(130px, 1fr))", borderBottom: "1px solid var(--fac-divider)" }}>
                <div style={{ padding: "13px 16px" }}>
                  <div className="fac-font-mono" style={{ font: "500 13px/1.2 var(--fac-font-mono)", color: "var(--fac-primary)" }}>P{p.periodNo}</div>
                  <div className="fac-font-mono" style={{ font: "400 11px/1.3 var(--fac-font-mono)", color: "var(--fac-tertiary)" }}>{p.startTime.slice(0, 5)}</div>
                </div>
                {[1, 2, 3, 4, 5, 6].map((d) => {
                  const slot = days.find((dd) => dd.dayOfWeek === d)?.slots.find((s) => s.periodId === p.periodId);
                  return (
                    <div key={d} style={{ padding: "13px 16px", borderLeft: "1px solid var(--fac-divider)" }}>
                      {p.isBreak ? (
                        <div style={{ font: "400 12px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)", fontStyle: "italic" }}>{p.label ?? "Break"}</div>
                      ) : slot ? (
                        <>
                          <div style={{ font: "600 13.5px/1.3 var(--fac-font-sans)" }}>{slot.subjectName}</div>
                          <div style={{ font: "400 12px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>{slot.gradeName} {slot.sectionName}</div>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your timetable. Nothing was changed -- try again." />;
  }
}
