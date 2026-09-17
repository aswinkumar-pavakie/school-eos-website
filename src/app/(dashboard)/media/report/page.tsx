// Report -- pixel-rebuilt from the design's own isAnalytics screen. The
// scorecard is a real, user-curated CRUD table (media_report_metric) --
// the design's own New-metric form takes plain free-text values with no
// calculation behind them, so this was built as what it actually is: a
// simple list Media Room fills in themselves, not computed analytics (see
// this feature's own migration/repository comments). The two panels below
// it are real, computed breakdowns from data that does exist --
// "Requests by category" from real media_post.category counts, and
// "Indent outcomes" from real purchase_request.state counts -- replacing
// the design's own "Requests by section" (no per-section request tagging
// exists anywhere) and "Turnaround time" (no completion timestamp exists on
// shoot_assignment or purchase_request) panels, which have no real,
// non-fabricated data source in this schema. The design's own "Export
// Excel"/"Export PDF" buttons are dropped entirely -- no real export
// capability exists anywhere in this backend, and a button that does
// nothing when clicked is a false affordance.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/media-ui/primitives";
import { AuthExpiredError, getCurrentActor } from "@/lib/api";
import { listAcademicYears, listMediaIndents, listMediaPosts, listMediaReportMetrics, type IndentState, type MediaPostCategory } from "@/lib/media-api";
import { AddMetricPanel } from "./AddMetricPanel";
import { MetricRow } from "./MetricRow";

const CATEGORY_LABEL: Record<MediaPostCategory, string> = { EVENT: "Event", ACADEMIC: "Academic", DEPARTMENT: "Department", GENERAL: "General" };
const INDENT_LABEL: Record<IndentState, string> = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected", CANCELLED: "Cancelled" };

function pctOf(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

export default async function MediaReportPage() {
  try {
    const actor = await getCurrentActor().catch(() => null);
    const years = await listAcademicYears();
    const currentYear = years.find((y) => y.isCurrent) ?? years[years.length - 1];
    if (!currentYear) return <ErrorState message="No academic year has been set up yet." />;

    const [metrics, posts, indents] = await Promise.all([
      listMediaReportMetrics(currentYear.id),
      listMediaPosts(),
      listMediaIndents(),
    ]);

    const categoryCounts = (Object.keys(CATEGORY_LABEL) as MediaPostCategory[]).map((cat) => ({
      name: CATEGORY_LABEL[cat],
      count: posts.filter((p) => p.category === cat).length,
    }));
    const totalPosts = posts.length;

    const indentCounts = (Object.keys(INDENT_LABEL) as IndentState[]).map((st) => ({
      name: INDENT_LABEL[st],
      count: indents.filter((i) => i.state === st).length,
    }));
    const totalIndents = indents.length;

    return (
      <div className="media-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1.1 }}>Report</div>
            <div style={{ fontSize: 15.5, color: "var(--med-body-muted)", marginTop: 10 }}>Media room scorecard for AY {currentYear.name}</div>
          </div>
          <AddMetricPanel academicYearId={currentYear.id} />
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "26px 28px", marginTop: 26 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>Media scorecard</div>
          <div style={{ fontSize: 13.5, color: "var(--med-body-muted)", marginTop: 4 }}>Metrics the media room tracks against its own targets</div>

          {metrics.length === 0 ? (
            <div style={{ marginTop: 20 }}><EmptyPanel label="Add your first metric above." /></div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.3fr auto", gap: 16, marginTop: 22, paddingBottom: 14, borderBottom: "1px solid var(--med-divider-2)" }}>
                <span style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary)" }}>METRIC</span>
                <span style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary)", textAlign: "right" }}>THIS YEAR</span>
                <span style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary)", textAlign: "right" }}>TARGET</span>
                <span style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 700, color: "var(--med-tertiary)", textAlign: "right" }}>ATTAINMENT</span>
                <span />
              </div>
              {metrics.map((m) => (
                <MetricRow key={m.id} metric={m} canModify={!!actor && m.createdBy === actor.personId} />
              ))}
            </>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
          <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "26px 28px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>Requests by category</div>
            <div style={{ fontSize: 13.5, color: "var(--med-body-muted)", marginTop: 4 }}>{totalPosts} social post{totalPosts === 1 ? "" : "s"} this year, by category</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
              {categoryCounts.map((c) => {
                const pct = pctOf(c.count, totalPosts);
                return (
                  <div key={c.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14.5 }}>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      <span><b>{c.count}</b> <span style={{ color: "var(--med-tertiary)" }}>· {pct}%</span></span>
                    </div>
                    <div style={{ height: 7, borderRadius: 4, background: "var(--med-panel)", marginTop: 8, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--med-primary)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "26px 28px" }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>Indent outcomes</div>
            <div style={{ fontSize: 13.5, color: "var(--med-body-muted)", marginTop: 4 }}>{totalIndents} indent{totalIndents === 1 ? "" : "s"} raised, by outcome</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
              {indentCounts.map((c) => {
                const pct = pctOf(c.count, totalIndents);
                return (
                  <div key={c.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14.5 }}>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      <span><b>{c.count}</b> <span style={{ color: "var(--med-tertiary)" }}>· {pct}%</span></span>
                    </div>
                    <div style={{ height: 7, borderRadius: 4, background: "var(--med-panel)", marginTop: 8, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--med-primary)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the report."} />;
  }
}
