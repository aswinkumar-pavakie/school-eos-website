// Create timetable -- pixel-rebuilt from the design's own "isTimetable"
// screen: real KPI cards, a real "Subject staffing" panel (teachers per
// subject with their real weekly load), class-selector chips with a real
// published/draft/empty status dot, and the week grid itself (see
// TimetableGrid.tsx for edit mode + real teacher-clash detection). Every
// number here is composed from the same real endpoints already used
// elsewhere (getCoordinatorStructure/getCoordinatorOfferings/
// getFacultyWorkload/getCoordinatorTimetable) -- looped once per section in
// scope (typically a handful) to build a real cross-section picture, never
// a fabricated one.

import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { getCoordinatorOfferings, getCoordinatorStructure, getCoordinatorTimetable, getFacultyWorkload } from "@/lib/faculty-coordinator-api";
import { TimetableGrid } from "./TimetableGrid";
import { PublishAllButton } from "./PublishAllButton";

export default async function CreateTimetablePage({ searchParams }: { searchParams: Promise<{ sectionId?: string }> }) {
  try {
    const { sectionId: sectionIdParam } = await searchParams;
    const { sections } = await getCoordinatorStructure();
    const sectionId = sectionIdParam || sections[0]?.sectionId;

    if (!sectionId) return <ErrorState message="No sections in your scope." />;

    const [current, offerings, workload] = await Promise.all([
      getCoordinatorTimetable(sectionId),
      getCoordinatorOfferings({}),
      getFacultyWorkload(),
    ]);

    // Every other section's real published+draft slots -- built once, used
    // both for the class chips' status dot and for real "teacher busy
    // elsewhere" clash detection in the grid's edit mode.
    const allSections = await Promise.all(
      sections.map(async (s) => ({ section: s, data: s.sectionId === sectionId ? current : await getCoordinatorTimetable(s.sectionId) })),
    );

    const classChips = allSections.map(({ section, data }) => {
      const hasDraft = data.slots.some((sl) => sl.isDraft);
      const hasSlots = data.slots.length > 0;
      const dot = hasSlots ? (hasDraft ? "var(--acc-amber)" : "var(--acc-green)") : "var(--acc-border)";
      return { sectionId: section.sectionId, label: `${section.gradeName}-${section.sectionName}`, dot };
    });

    // teacherStaffId -> Set("day|periodId") occupied in any OTHER section --
    // real cross-section conflict data for the grid's clash hint.
    const occupancy: Record<string, string[]> = {};
    for (const { section, data } of allSections) {
      if (section.sectionId === sectionId) continue;
      for (const slot of data.slots) {
        const offering = offerings.find((o) => o.subjectOfferingId === slot.subjectOfferingId);
        if (!offering?.teacherStaffId) continue;
        const key = offering.teacherStaffId;
        occupancy[key] = occupancy[key] ?? [];
        occupancy[key].push(`${slot.dayOfWeek}|${slot.periodId}`);
      }
    }

    const currentOfferings = offerings.filter((o) => o.sectionId === sectionId);

    const subjectStaffing = new Map<string, { subjectName: string; teachers: Map<string, number> }>();
    for (const o of offerings) {
      if (!o.teacherStaffId) continue;
      if (!subjectStaffing.has(o.subjectName)) subjectStaffing.set(o.subjectName, { subjectName: o.subjectName, teachers: new Map() });
      const entry = subjectStaffing.get(o.subjectName)!;
      const load = workload.find((w) => w.staffId === o.teacherStaffId)?.weeklyPeriods ?? 0;
      entry.teachers.set(o.teacherStaffId + ":" + o.teacherName, load);
    }

    const classesWithTimetable = allSections.filter(({ data }) => data.slots.length > 0).length;
    const fullyPublished = allSections.filter(({ data }) => data.slots.length > 0 && !data.slots.some((s) => s.isDraft)).length;
    const totalDraftPeriods = allSections.reduce((sum, { data }) => sum + data.slots.filter((s) => s.isDraft).length, 0);
    const unassignedOfferings = offerings.filter((o) => !o.teacherStaffId).length;

    const kpis = [
      { label: "Classes with a timetable", value: `${classesWithTimetable}/${sections.length}` },
      { label: "Fully published", value: `${fullyPublished}/${sections.length}` },
      { label: "Draft periods across scope", value: String(totalDraftPeriods) },
      { label: "Unassigned subject offerings", value: String(unassignedOfferings) },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>Create timetable</div>
            <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7 }}>Monday to Saturday · a draft stays invisible to the real teacher until you publish it</div>
          </div>
          <PublishAllButton />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
          {kpis.map((k) => (
            <div key={k.label} style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "19px 20px" }}>
              <div style={{ fontSize: 14, color: "var(--acc-body-muted)", fontWeight: 600 }}>{k.label}</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em", margin: "9px 0 6px" }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "20px 22px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)" }}>Subject staffing</div>
          <div style={{ fontSize: 13, color: "var(--acc-body-muted)", margin: "5px 0 16px" }}>Teachers assigned to each subject in your scope · real weekly load per teacher</div>
          {[...subjectStaffing.values()].map((s) => (
            <div key={s.subjectName} style={{ display: "grid", gridTemplateColumns: "minmax(140px, 180px) minmax(0, 1fr)", gap: 14, alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--acc-divider-soft)" }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--acc-navy)" }}>{s.subjectName}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[...s.teachers.entries()].map(([key, load]) => (
                  <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", border: "1px solid var(--acc-border)", background: "#fff", borderRadius: 99, padding: "6px 13px", fontSize: 12.5, color: "var(--acc-body)" }}>
                    {key.split(":")[1]}
                    <span style={{ color: "var(--acc-tertiary)", fontFamily: "var(--acc-font-mono)", fontSize: 11.5 }}>{load}p/wk</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
          {subjectStaffing.size === 0 && <div style={{ fontSize: 13.5, color: "var(--acc-tertiary)" }}>No subject offerings with an assigned teacher yet.</div>}
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--acc-tertiary)", fontWeight: 700 }}>SELECT A CLASS</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {classChips.map((c) => (
              <Link key={c.sectionId} href={`/academic-coordinator/timetable?sectionId=${c.sectionId}`} style={{ textDecoration: "none" }}>
                <span
                  style={{
                    border: `1px solid ${c.sectionId === sectionId ? "var(--acc-accent)" : "var(--acc-btn-border)"}`,
                    background: c.sectionId === sectionId ? "var(--acc-accent)" : "#fff",
                    color: c.sectionId === sectionId ? "#fff" : "var(--acc-body)",
                    borderRadius: 99,
                    padding: "9px 16px",
                    fontSize: 13.5,
                    fontWeight: 700,
                    fontFamily: "var(--acc-font-mono)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {c.label}
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.sectionId === sectionId ? "#fff" : c.dot }} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <TimetableGrid
          sectionId={sectionId}
          sectionLabel={`${current.section.gradeName} ${current.section.sectionName}`}
          periods={current.periods}
          slots={current.slots}
          offerings={currentOfferings}
          occupancy={occupancy}
        />
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the timetable."} />;
  }
}
