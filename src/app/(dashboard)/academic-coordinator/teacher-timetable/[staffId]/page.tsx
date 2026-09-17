// Teacher timetable -- detail, pixel-rebuilt from the design's own
// "isTeacherTtDetail" screen (back button, name/meta, 3 stat cards, full
// week grid). Real, already-published timetable_slot data (the same
// ACADEMIC_COORDINATOR-readable /timetable endpoint Substitute teacher
// already uses) -- no new backend needed.

import { Fragment } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { Card, EmptyPanel } from "@/components/academic-coordinator-ui/primitives";
import { getFacultyWorkload, getTeacherTimetable, listAllTimetablePeriods } from "@/lib/faculty-coordinator-api";

const DAYS = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
] as const;

export default async function TeacherTimetableDetailPage({ params }: { params: Promise<{ staffId: string }> }) {
  const { staffId } = await params;
  try {
    const [workload, periods] = await Promise.all([getFacultyWorkload(), listAllTimetablePeriods()]);
    const picked = workload.find((t) => t.staffId === staffId);
    if (!picked) return <ErrorState message="Teacher not found in your scope." />;

    const teachingPeriods = periods.filter((p) => !p.isBreak).sort((a, b) => a.periodNo - b.periodNo);
    const slots = await getTeacherTimetable(picked.staffId);
    const totalSlotsPerWeek = teachingPeriods.length * DAYS.length;
    const freeCount = Math.max(0, totalSlotsPerWeek - picked.weeklyPeriods);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <Link href="/academic-coordinator/teacher-timetable" style={{ textDecoration: "none" }}>
              <span style={{ background: "#fff", border: "1px solid var(--acc-btn-border)", color: "var(--acc-navy)", borderRadius: 10, padding: "11px 16px", fontSize: 14, fontWeight: 700, display: "inline-block" }}>
                ← All teachers
              </span>
            </Link>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "var(--acc-navy)" }}>{picked.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)", marginTop: 2 }}>
                {picked.offeringCount} subject offering{picked.offeringCount === 1 ? "" : "s"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { value: picked.weeklyPeriods, label: "PERIODS/WK" },
              { value: picked.offeringCount, label: "OFFERINGS" },
              { value: freeCount, label: "FREE/WK" },
            ].map((s) => (
              <div key={s.label} style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "9px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: "var(--acc-navy)" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--acc-tertiary)", letterSpacing: "0.05em", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <Card style={{ overflowX: "auto" }}>
          {teachingPeriods.length === 0 ? (
            <EmptyPanel label="No timetable periods configured yet." />
          ) : (
            <div style={{ minWidth: 1040 }}>
              <div style={{ display: "grid", gridTemplateColumns: `74px repeat(${DAYS.length}, minmax(124px, 1fr))`, gap: 8, paddingBottom: 10, borderBottom: "1px solid var(--acc-divider)" }}>
                <div />
                {DAYS.map(([, label]) => (
                  <div key={label} style={{ fontSize: 12, fontWeight: 800, color: "var(--acc-navy)" }}>{label}</div>
                ))}
              </div>
              {teachingPeriods.map((p) => (
                <div key={p.id} style={{ display: "grid", gridTemplateColumns: `74px repeat(${DAYS.length}, minmax(124px, 1fr))`, gap: 8, padding: "9px 0", borderBottom: "1px solid var(--acc-divider-soft)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--acc-navy)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    P{p.periodNo}
                    <span style={{ fontSize: 9.5, color: "var(--acc-tertiary)", fontWeight: 500 }}>{p.startTime.slice(0, 5)}</span>
                  </div>
                  {DAYS.map(([dayNo]) => {
                    const slot = slots.find((s) => s.periodId === p.id && s.dayOfWeek === dayNo);
                    return (
                      <div
                        key={dayNo}
                        style={{
                          minHeight: 62,
                          borderRadius: 10,
                          padding: "10px 11px",
                          background: slot ? "var(--acc-accent-tint)" : "var(--acc-panel)",
                          border: slot ? "1px solid var(--acc-btn-border)" : "1px solid var(--acc-divider-soft)",
                        }}
                      >
                        {slot && (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--acc-navy)", lineHeight: 1.25 }}>{slot.gradeName} {slot.sectionName}</div>
                            <div style={{ fontSize: 11.5, color: "var(--acc-body-muted)", marginTop: 5, lineHeight: 1.3 }}>{slot.subjectName}</div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)", marginTop: 14 }}>Empty cells are free periods. The Substitute teacher page picks cover from these.</div>
        </Card>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load this teacher's timetable."} />;
  }
}
