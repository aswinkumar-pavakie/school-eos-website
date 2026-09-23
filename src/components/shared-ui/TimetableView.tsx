// Shared "Timetable" feature screen -- the canonical pixel design ported
// from Faculty's own timetable/page.tsx (Faculty's screen is the source of
// truth), restyled to the site-wide --eos-* tokens (globals.css) so every
// role with a personal weekly-timetable feature renders byte-for-byte the
// same screen. A plain Server Component (no client state) -- exactly like
// Faculty's original, view/day navigation is real query-param links, not
// client-side state, so this needs no "use client".
//
// Callers normalize their own role's timetable data into the two shapes
// below before rendering this -- see faculty/timetable/page.tsx and
// parent/timetable/page.tsx for the two real mappings today.

const DAY_LABELS: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };
const WEEK_DAYS = [1, 2, 3, 4, 5, 6];

export interface TimetablePeriod {
  periodId: string;
  periodNo: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  label?: string | null;
}

export interface TimetableCell {
  periodId: string;
  dayOfWeek: number;
  /** Subject name -- the bold primary line. */
  title: string;
  /** e.g. "8-B" (Faculty: grade+section) or a teacher's name (Parent). */
  subtitle?: string | null;
  /** Optional small pill on the right of a Today-view row (Faculty's room number). */
  tag?: string | null;
}

export function TimetableView({
  periods,
  cells,
  basePath,
  subtitle,
  isWeek,
  selectedDay,
}: {
  periods: TimetablePeriod[];
  cells: TimetableCell[];
  /** e.g. "/faculty/timetable" or "/parent/timetable?studentId=abc" (may
   * already carry its own query params -- day/view are appended with `&`
   * when a `?` is already present, `?` otherwise). */
  basePath: string;
  subtitle: string;
  isWeek: boolean;
  selectedDay: number;
}) {
  const sep = basePath.includes("?") ? "&" : "?";
  const dayCells = new Map(cells.filter((c) => c.dayOfWeek === selectedDay).map((c) => [c.periodId, c]));
  const todayRows = periods.filter((p) => !p.isBreak).map((p) => ({ p, cell: dayCells.get(p.periodId) })).filter((r) => r.cell);
  const uniqueSubjects = new Set(todayRows.map((r) => r.cell!.title)).size;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 style={{ margin: 0, font: "700 36px/1.1 var(--eos-font-sans)", letterSpacing: "-.02em", color: "var(--eos-ink)" }}>Timetable</h1>
          <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>{subtitle}</p>
        </div>
        <div style={{ display: "flex", background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: 10, padding: 4, gap: 4 }}>
          <a href={basePath} style={{ border: 0, cursor: "pointer", borderRadius: 7, padding: "10px 20px", font: "600 14px/1 var(--eos-font-sans)", background: !isWeek ? "var(--eos-primary)" : "transparent", color: !isWeek ? "#fff" : "var(--eos-body)", textDecoration: "none" }}>
            Today
          </a>
          <a href={`${basePath}${sep}view=week`} style={{ border: 0, cursor: "pointer", borderRadius: 7, padding: "10px 20px", font: "600 14px/1 var(--eos-font-sans)", background: isWeek ? "var(--eos-primary)" : "transparent", color: isWeek ? "#fff" : "var(--eos-body)", textDecoration: "none" }}>
            Full week
          </a>
        </div>
      </div>

      {periods.length === 0 ? (
        <div style={{ marginTop: 22, textAlign: "center", padding: 40, font: "400 14.5px/1.5 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>
          No periods are configured yet.
        </div>
      ) : !isWeek ? (
        <div>
          <div style={{ background: "var(--eos-primary)", borderRadius: 14, padding: "20px 22px", marginTop: 22 }}>
            <div style={{ font: "600 14px/1 var(--eos-font-sans)", color: "var(--eos-tint)" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div className="grid grid-cols-6 gap-3" style={{ marginTop: 14 }}>
              {WEEK_DAYS.map((d) => (
                <a
                  key={d}
                  href={`${basePath}${sep}day=${d}`}
                  style={{ border: 0, cursor: "pointer", borderRadius: 10, padding: "14px 0", textAlign: "center", background: d === selectedDay ? "#fff" : "rgba(255,255,255,.15)", color: d === selectedDay ? "var(--eos-primary)" : "#fff", display: "block", textDecoration: "none" }}
                >
                  <span style={{ display: "block", font: "600 11.5px/1 var(--eos-font-sans)", letterSpacing: ".08em", opacity: 0.85 }}>{DAY_LABELS[d]}</span>
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
              <div key={s.label} style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: "16px 20px" }}>
                <div style={{ font: "600 11px/1 var(--eos-font-sans)", letterSpacing: ".09em", color: "var(--eos-tertiary)" }}>{s.label}</div>
                <div style={{ font: "700 30px/1.1 var(--eos-font-sans)", marginTop: 9, color: "var(--eos-ink)" }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2.5" style={{ marginTop: 16 }}>
            {periods.map((p) => {
              const cell = dayCells.get(p.periodId);
              return (
                <div key={p.periodId} className="flex items-center gap-4.5" style={{ background: p.isBreak ? "var(--eos-panel)" : "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: 11, padding: "15px 20px" }}>
                  <div style={{ width: 56 }}>
                    <div style={{ font: "500 13.5px/1.2 var(--font-ibm-plex-mono), ui-monospace, monospace", color: "var(--eos-primary)" }}>{p.startTime.slice(0, 5)}</div>
                    <div style={{ font: "400 11.5px/1.3 var(--font-ibm-plex-mono), ui-monospace, monospace", color: "var(--eos-tertiary)" }}>P{p.periodNo}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {p.isBreak ? (
                      <div style={{ font: "600 15.5px/1.3 var(--eos-font-sans)", color: "var(--eos-body-muted)", fontStyle: "italic" }}>{p.label ?? "Break"}</div>
                    ) : cell ? (
                      <>
                        <div style={{ font: "600 15.5px/1.3 var(--eos-font-sans)", color: "var(--eos-ink)" }}>{cell.title}</div>
                        {cell.subtitle && <div style={{ font: "400 13px/1.3 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>{cell.subtitle}</div>}
                      </>
                    ) : (
                      <div style={{ font: "600 15.5px/1.3 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>Free · {p.label ?? `Period ${p.periodNo}`}</div>
                    )}
                  </div>
                  {cell?.tag && (
                    <span style={{ font: "500 12.5px/1 var(--eos-font-sans)", color: "var(--eos-primary)", background: "var(--eos-tint)", borderRadius: 7, padding: "7px 11px" }}>{cell.tag}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", marginTop: 22, overflow: "auto" }}>
          <div className="grid" style={{ gridTemplateColumns: "90px repeat(6, minmax(130px, 1fr))", background: "var(--eos-panel)", borderBottom: "1px solid var(--eos-border)" }}>
            <div style={{ padding: "14px 16px", font: "600 11px/1 var(--eos-font-sans)", letterSpacing: ".08em", color: "var(--eos-body-muted)" }}>PERIOD</div>
            {WEEK_DAYS.map((d) => (
              <div key={d} style={{ padding: "14px 16px", font: "600 11px/1 var(--eos-font-sans)", letterSpacing: ".08em", color: "var(--eos-body-muted)" }}>{DAY_LABELS[d]}</div>
            ))}
          </div>
          {periods.map((p) => (
            <div key={p.periodId} className="grid" style={{ gridTemplateColumns: "90px repeat(6, minmax(130px, 1fr))", borderBottom: "1px solid var(--eos-divider)" }}>
              <div style={{ padding: "13px 16px" }}>
                <div style={{ font: "500 13px/1.2 var(--font-ibm-plex-mono), ui-monospace, monospace", color: "var(--eos-primary)" }}>P{p.periodNo}</div>
                <div style={{ font: "400 11px/1.3 var(--font-ibm-plex-mono), ui-monospace, monospace", color: "var(--eos-tertiary)" }}>{p.startTime.slice(0, 5)}</div>
              </div>
              {WEEK_DAYS.map((d) => {
                const cell = cells.find((c) => c.dayOfWeek === d && c.periodId === p.periodId);
                return (
                  <div key={d} style={{ padding: "13px 16px", borderLeft: "1px solid var(--eos-divider)" }}>
                    {p.isBreak ? (
                      <div style={{ font: "400 12px/1.3 var(--eos-font-sans)", color: "var(--eos-tertiary)", fontStyle: "italic" }}>{p.label ?? "Break"}</div>
                    ) : cell ? (
                      <>
                        <div style={{ font: "600 13.5px/1.3 var(--eos-font-sans)", color: "var(--eos-ink)" }}>{cell.title}</div>
                        {cell.subtitle && <div style={{ font: "400 12px/1.3 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>{cell.subtitle}</div>}
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
}
