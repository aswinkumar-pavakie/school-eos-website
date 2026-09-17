// Notices -- pixel-rebuilt from the design's own isNotices screen. Real
// AnnouncementsService data (same feed the Home page's own "Notices" panel
// summarizes), scoped to this child's real school/role/section audience.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/parent-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { listAnnouncements, listChildren, resolveSelectedChild } from "@/lib/parent-api";

export default async function ParentNoticesPage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const notices = await listAnnouncements(selected.studentId);

    return (
      <div className="parent-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6, color: "var(--par-ink)" }}>Notices</div>
            <div style={{ fontSize: 15, color: "var(--par-body-muted)" }}>Notices from the school for {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join("-")}</div>
          </div>
        </div>

        {notices.length === 0 ? (
          <EmptyPanel label="No notices yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {notices.map((n) => (
              <div key={n.id} style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--par-tint)", color: "var(--par-primary)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>PP</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--par-ink)" }}>Pavakie Public School</div>
                    <div style={{ fontSize: 14, color: "var(--par-tertiary)" }}>{new Date(n.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, background: n.isEmergency ? "var(--par-red-bg)" : "var(--par-tint)", color: n.isEmergency ? "var(--par-red)" : "var(--par-primary)", padding: "5px 12px", borderRadius: 20 }}>
                    {n.category ?? n.priority}
                  </span>
                </div>
                <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 6, color: "var(--par-ink)" }}>{n.title}</div>
                <div style={{ fontSize: 14, color: "var(--par-body)", lineHeight: 1.6, marginBottom: 12 }}>{n.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load notices."} />;
  }
}
