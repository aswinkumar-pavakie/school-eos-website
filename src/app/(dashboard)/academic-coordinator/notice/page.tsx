// Notice -- pixel-adapted from the design's own Notice screen. Real
// AnnouncementsService data (same one Admin/Principal/Faculty already use),
// server-enforced to this coordinator's own scoped sections or every
// Academic Coordinator -- see faculty-academic-coordinator.service.ts's own
// createNotice/listNotices.

import { ErrorState } from "@/components/ui/EmptyState";
import { Card, EmptyPanel } from "@/components/academic-coordinator-ui/primitives";
import { formatDate } from "@/lib/format";
import { getCoordinatorStructure, listCoordinatorNotices } from "@/lib/faculty-coordinator-api";
import { NewNoticeForm } from "./NewNoticeForm";
import { NoticeCardActions } from "./NoticeCardActions";

export default async function NoticePage() {
  try {
    const [notices, { sections }] = await Promise.all([listCoordinatorNotices(), getCoordinatorStructure()]);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 31, fontWeight: 800, color: "var(--acc-navy)", letterSpacing: "-0.02em" }}>Notice</div>
            <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7 }}>Circulars you receive and notices you publish</div>
          </div>
          <NewNoticeForm sections={sections} />
        </div>

        {notices.length === 0 && <EmptyPanel label="No notices yet." />}
        {notices.map((n) => (
          <Card key={n.id} style={{ padding: "19px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ background: "var(--acc-accent-tint)", color: "var(--acc-accent)", borderRadius: 6, padding: "4px 9px", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em" }}>
                {n.priority}
              </span>
              <span style={{ fontSize: 13, color: "var(--acc-tertiary)" }}>{formatDate(n.createdAt)}</span>
              {n.canEdit && <span style={{ fontSize: 12, color: "var(--acc-accent)", fontWeight: 700 }}>Posted by you</span>}
            </div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "var(--acc-navy)", lineHeight: 1.3 }}>{n.title}</div>
            <div style={{ fontSize: 14.5, color: "var(--acc-body-muted)", marginTop: 7, lineHeight: 1.55 }}>{n.body}</div>
            <div style={{ fontSize: 13, color: "var(--acc-tertiary)", marginTop: 11 }}>
              Audience · {n.audiences.map((a) => (a.audienceType === "SCHOOL" ? "Whole school" : a.audienceType === "ROLE" ? "Academic Coordinators" : "Your section")).join(", ")}
            </div>
            {n.canEdit && <NoticeCardActions notice={n} />}
          </Card>
        ))}
      </div>
    );
  } catch (err) {
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load notices."} />;
  }
}
