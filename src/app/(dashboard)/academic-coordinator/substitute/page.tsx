// Substitute teacher -- pixel-rebuilt from the design's own "isSubstitute"
// screen: real "today's gaps" (an APPROVED staff_leave_request covering the
// date -- the one real absence signal this schema has -- crossed with that
// teacher's own real published timetable_slot rows), real ranked-by-load
// free candidates, and real persisted assignments in the `substitution`
// table (confirmed unused anywhere else in this backend before this). See
// faculty-academic-coordinator.service.ts's own listSubstituteGaps. If no
// one has approved leave for the date, there are genuinely no gaps to show
// -- never a fabricated "auto-detected absence".

import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/academic-coordinator-ui/primitives";
import { listSubstituteGaps } from "@/lib/faculty-coordinator-api";
import { GapCard } from "./GapCard";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function SubstituteTeacherPage({ searchParams }: { searchParams: Promise<{ date?: string; tab?: string }> }) {
  const { date, tab } = await searchParams;
  const effectiveDate = date || todayIso();
  const activeTab = tab === "assigned" || tab === "byTeacher" ? tab : "open";

  try {
    const { gaps, absentTeachers } = await listSubstituteGaps(effectiveDate);
    const openGaps = gaps.filter((g) => !g.assignedSubstituteStaffId);
    const assignedGaps = gaps.filter((g) => g.assignedSubstituteStaffId);
    const byTeacher = absentTeachers.map((t) => ({
      teacher: t,
      gaps: gaps.filter((g) => g.absentStaffId === t.staffId),
    }));

    const tabs = [
      { key: "open", label: "Open periods", count: openGaps.length },
      { key: "assigned", label: "Assigned", count: assignedGaps.length },
      { key: "byTeacher", label: "By teacher", count: absentTeachers.length },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>Substitute teacher</div>
          <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7 }}>
            {new Date(effectiveDate).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} · cover suggested from the real teacher timetable
          </div>
        </div>

        <form style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="hidden" name="tab" value={activeTab} />
          <input type="date" name="date" defaultValue={effectiveDate} style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "10px 12px", fontSize: 14 }} />
          <button type="submit" style={{ background: "#fff", border: "1px solid var(--acc-btn-border)", color: "var(--acc-navy)", borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Go
          </button>
        </form>

        <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--acc-tertiary)", fontWeight: 700 }}>TODAY&rsquo;S GAPS</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--acc-navy)", marginTop: 7 }}>{gaps.length}</div>
            </div>
            <span style={{ background: "var(--acc-accent-tint)", color: "var(--acc-accent)", borderRadius: 99, padding: "5px 13px", fontSize: 12.5, fontWeight: 700 }}>
              {openGaps.length} open
            </span>
          </div>
          <div style={{ height: 8, background: "#eef2f8", borderRadius: 99, margin: "16px 0", overflow: "hidden" }}>
            <div style={{ height: 8, background: "var(--acc-accent)", width: gaps.length > 0 ? `${Math.round((assignedGaps.length / gaps.length) * 100)}%` : "0%" }} />
          </div>
          <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)" }}>
            {absentTeachers.length} teacher{absentTeachers.length === 1 ? "" : "s"} on approved leave today
          </div>
        </div>

        <div style={{ display: "flex", background: "#fff", border: "1px solid var(--acc-border)", borderRadius: 12, padding: 5, width: "fit-content", gap: 4, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <a
              key={t.key}
              href={`/academic-coordinator/substitute?date=${effectiveDate}&tab=${t.key}`}
              style={{
                textDecoration: "none",
                padding: "10px 22px",
                borderRadius: 9,
                fontSize: 14,
                cursor: "pointer",
                background: activeTab === t.key ? "var(--acc-accent)" : "transparent",
                color: activeTab === t.key ? "#fff" : "#334155",
                fontWeight: activeTab === t.key ? 700 : 500,
              }}
            >
              {t.label} · {t.count}
            </a>
          ))}
        </div>

        {activeTab === "open" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--acc-tertiary)", fontWeight: 700 }}>OPEN PERIODS</div>
            {openGaps.map((g) => (
              <GapCard key={g.timetableSlotId} gap={g} date={effectiveDate} />
            ))}
            {openGaps.length === 0 && <EmptyPanel label="No open gaps for this date." />}
          </div>
        )}

        {activeTab === "assigned" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--acc-tertiary)", fontWeight: 700 }}>ASSIGNED PERIODS</div>
            {assignedGaps.map((g) => (
              <GapCard key={g.timetableSlotId} gap={g} date={effectiveDate} />
            ))}
            {assignedGaps.length === 0 && <EmptyPanel label="No periods assigned yet for this date." />}
          </div>
        )}

        {activeTab === "byTeacher" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--acc-tertiary)", fontWeight: 700 }}>ABSENT TEACHERS · ALL THEIR GAPS</div>
            {byTeacher.map(({ teacher, gaps: teacherGaps }) => (
              <div key={teacher.staffId} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ fontSize: 16.5, fontWeight: 800, color: "var(--acc-navy)" }}>{teacher.name}</div>
                  <div style={{ fontSize: 13, color: "var(--acc-body-muted)", marginTop: 4 }}>
                    {teacherGaps.length} period{teacherGaps.length === 1 ? "" : "s"} today
                  </div>
                </div>
                {teacherGaps.map((g) => (
                  <GapCard key={g.timetableSlotId} gap={g} date={effectiveDate} />
                ))}
              </div>
            ))}
            {byTeacher.length === 0 && <EmptyPanel label="No teachers on approved leave for this date." />}
          </div>
        )}
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load substitute teacher data."} />;
  }
}
