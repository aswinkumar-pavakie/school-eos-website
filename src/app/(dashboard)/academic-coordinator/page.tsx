// Academic Coordinator Dashboard -- pixel-rebuilt from the design's own
// "isDash" screen. Real data only: getCoordinatorDashboard() (real
// structure/offering/advisor counts) and listCoordinatorCalendarEvents()
// (real "This week" schedule). The design's own demo KPIs ("Attendance
// today", generic "approvals waiting") and its Notices/Messages/Grade-health
// panels have no confirmed real backend yet in this module (see the
// project's own research pass) -- rather than fabricate numbers for those,
// this Dashboard surfaces exactly what getCoordinatorDashboard() actually
// returns, honestly labelled, and defers Notices/Messages/Grade-health to
// their own screens once/if a real backend exists for them.

import { apiFetch } from "@/lib/api";
import { ErrorState } from "@/components/ui/EmptyState";
import { KpiCard, Card, Row } from "@/components/academic-coordinator-ui/primitives";
import { getCoordinatorDashboard, listCoordinatorCalendarEvents } from "@/lib/faculty-coordinator-api";

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AcademicCoordinatorDashboardPage() {
  try {
    const [dashboard, calendarEvents, personRes] = await Promise.all([
      getCoordinatorDashboard(),
      listCoordinatorCalendarEvents().catch(() => []),
      apiFetch("/auth/me"),
    ]);
    const person = personRes.ok
      ? ((await personRes.json()) as { data: { person: { firstName: string; lastName: string | null } } }).data.person
      : null;
    const personName = person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : "";

    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const upcoming = calendarEvents
      .filter((e) => e.endDate >= todayIso)
      .sort((a, b) => (a.startDate < b.startDate ? -1 : 1))
      .slice(0, 6);

    const attention: { title: string; sub: string }[] = [];
    if (dashboard.unassignedOfferings > 0)
      attention.push({ title: `${dashboard.unassignedOfferings} subject offering${dashboard.unassignedOfferings === 1 ? "" : "s"} without a teacher`, sub: "Assign a teacher from Exam setup / offerings" });
    if (dashboard.sectionsWithoutAdvisor > 0)
      attention.push({ title: `${dashboard.sectionsWithoutAdvisor} section${dashboard.sectionsWithoutAdvisor === 1 ? "" : "s"} without a class advisor`, sub: "Assign a class advisor for full coverage" });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div style={{ fontSize: 33, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {greeting(now.getHours())}{personName ? `, ${personName}` : ""}
          </div>
          <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 8 }}>
            {now.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })} · {dashboard.stages.length} stage{dashboard.stages.length === 1 ? "" : "s"} under your co-ordination
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
          <KpiCard label="Grades under you" value={dashboard.gradeCount} hi={String(dashboard.sectionCount)} sub="sections" href="/academic-coordinator/students" />
          <KpiCard label="Students" value={dashboard.studentCount} sub="across all your sections" href="/academic-coordinator/students" />
          <KpiCard label="Teaching staff" value={dashboard.facultyCount} sub="reporting to you" href="/academic-coordinator/teachers" />
          <KpiCard
            label="Subject offerings"
            value={dashboard.subjectOfferingCount}
            hi={dashboard.unassignedOfferings > 0 ? String(dashboard.unassignedOfferings) : undefined}
            sub={dashboard.unassignedOfferings > 0 ? "still unassigned" : "all assigned"}
            barPct={
              dashboard.subjectOfferingCount > 0
                ? Math.round(((dashboard.subjectOfferingCount - dashboard.unassignedOfferings) / dashboard.subjectOfferingCount) * 100)
                : undefined
            }
            href="/academic-coordinator/exams"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16, alignItems: "start" }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)" }}>Needs attention</div>
              <span style={{ background: "var(--acc-accent-tint)", color: "var(--acc-accent)", borderRadius: 99, padding: "4px 11px", fontSize: 12.5, fontWeight: 700 }}>{attention.length} flags</span>
            </div>
            {attention.map((a) => (
              <Row key={a.title}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--acc-accent)", marginTop: 7, flex: "0 0 7px" }} />
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--acc-navy)", lineHeight: 1.35 }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: "var(--acc-body-muted)", marginTop: 3 }}>{a.sub}</div>
                </div>
              </Row>
            ))}
            {attention.length === 0 && <div style={{ fontSize: 13.5, color: "var(--acc-body-muted)" }}>Nothing needs attention right now.</div>}
          </Card>

          <Card>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)", marginBottom: 4 }}>This week</div>
            <div style={{ fontSize: 13, color: "var(--acc-body-muted)", marginBottom: 14 }}>Co-ordination calendar for your stage(s)</div>
            {upcoming.map((e) => {
              const d = new Date(e.startDate);
              return (
                <Row key={e.id}>
                  <div style={{ width: 46, flex: "0 0 46px", textAlign: "center", border: "1px solid var(--acc-border)", borderRadius: 9, padding: "6px 0" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--acc-navy)", lineHeight: 1 }}>{String(d.getDate()).padStart(2, "0")}</div>
                    <div style={{ fontSize: 10, color: "var(--acc-tertiary)", letterSpacing: "0.06em", marginTop: 2 }}>{d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--acc-navy)" }}>{e.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--acc-body-muted)", marginTop: 2 }}>{e.description ?? ""}</div>
                  </div>
                  <span style={{ background: "var(--acc-accent-tint)", color: "var(--acc-accent)", borderRadius: 99, padding: "4px 11px", fontSize: 12, fontWeight: 700 }}>{e.eventType}</span>
                </Row>
              );
            })}
            {upcoming.length === 0 && <div style={{ fontSize: 13.5, color: "var(--acc-body-muted)" }}>No calendar events on record for this week.</div>}
          </Card>
        </div>
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the dashboard."} />;
  }
}
