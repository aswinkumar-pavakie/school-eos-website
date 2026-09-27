// Teachers -- pixel-adapted from the design's own Teachers screen. Real
// data composed from getFacultyWorkload() (real periods/week, already
// scoped to this coordinator) and getCoordinatorOfferings() (real
// subject+section assignments, grouped per teacher) -- no new backend
// needed, both already exist and are already used elsewhere in this
// module. Syllabus % has no real backend anywhere in this schema (confirmed
// during research) -- omitted rather than fabricated.

import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/academic-coordinator-ui/primitives";
import { getCoordinatorOfferings, getFacultyWorkload } from "@/lib/faculty-coordinator-api";

export default async function TeachersPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search } = await searchParams;

  try {
    const [workload, offerings] = await Promise.all([getFacultyWorkload(), getCoordinatorOfferings()]);

    const bySubjectId = new Map<string, { gradeName: string; sectionName: string; subjectName: string }[]>();
    for (const o of offerings) {
      if (!o.teacherStaffId) continue;
      const list = bySubjectId.get(o.teacherStaffId) ?? [];
      list.push({ gradeName: o.gradeName, sectionName: o.sectionName, subjectName: o.subjectName });
      bySubjectId.set(o.teacherStaffId, list);
    }

    const needle = (search ?? "").trim().toLowerCase();
    const rows = workload
      .filter((t) => !needle || t.name.toLowerCase().includes(needle))
      .map((t) => ({ ...t, offeringsList: bySubjectId.get(t.staffId) ?? [] }));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>Teachers</div>
          <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7 }}>{workload.length} teachers reporting to you</div>
        </div>

        <form style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--acc-panel)", border: "1px solid var(--acc-border)", borderRadius: 10, padding: "11px 13px", flex: 1, minWidth: 240 }}>
            <span style={{ color: "var(--acc-tertiary)", fontSize: 13 }}>Search</span>
            <input name="search" defaultValue={search ?? ""} placeholder="teacher name" style={{ border: 0, background: "transparent", outline: "none", flex: 1, fontSize: 14 }} />
          </div>
          <button type="submit" style={{ background: "#fff", border: "1px solid var(--acc-btn-border)", color: "var(--acc-navy)", borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Go
          </button>
        </form>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 18 }}>
          {rows.map((t) => (
            <div key={t.staffId} className="acc-card-hover" style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, flex: "0 0 40px", borderRadius: 10, background: "var(--acc-accent-tint)", color: "var(--acc-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13.5, fontWeight: 700 }}>
                  {t.name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--acc-navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--acc-body-muted)", marginTop: 3 }}>{t.offeringsList.length} offering{t.offeringsList.length === 1 ? "" : "s"}</div>
                </div>
              </div>
              <div style={{ height: 6, background: "var(--acc-border)", borderRadius: 99, marginTop: 15, overflow: "hidden" }}>
                <div style={{ height: 6, background: "var(--acc-accent)", width: `${Math.min(100, Math.round((t.weeklyPeriods / 40) * 100))}%` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12.5, color: "var(--acc-body-muted)" }}>
                <span>{t.weeklyPeriods} periods/week</span>
              </div>
              {t.offeringsList.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--acc-divider-soft)", fontSize: 12.5, color: "var(--acc-body)" }}>
                  {t.offeringsList.slice(0, 4).map((o, i) => (
                    <div key={i}>
                      {o.gradeName} {o.sectionName} · {o.subjectName}
                    </div>
                  ))}
                  {t.offeringsList.length > 4 && <div style={{ color: "var(--acc-tertiary)" }}>+{t.offeringsList.length - 4} more</div>}
                </div>
              )}
            </div>
          ))}
        </div>
        {rows.length === 0 && <EmptyPanel label="No teachers match this search." />}
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load teachers."} />;
  }
}
