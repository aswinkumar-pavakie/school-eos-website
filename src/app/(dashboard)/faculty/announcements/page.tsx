// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isNotice" screen
// (nav label "Notice"). Reuses EXISTING real
// listAnnouncements/listMyAnnouncements/create/update/delete unchanged. The
// design's own noticeTabs markup was empty (a bug in the source -- verified
// during research) even though it had real sample data; this rebuild gives
// it working real tabs (All / My posts) backed by the two real list calls.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listAdvisorSections, listAnnouncements, listMyAnnouncements, listTeachingOfferings, type Announcement } from "@/lib/faculty-api";
import { Tabs } from "@/components/faculty-ui/Tabs";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { NoticeFormModal } from "./NoticeFormModal";
import { deleteAnnouncementAction } from "./actions";

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  try {
    const { tab } = await searchParams;
    const mineOnly = tab === "mine";

    const [advisorSections, teachingOfferings, announcements] = await Promise.all([
      listAdvisorSections(),
      listTeachingOfferings(),
      mineOnly ? listMyAnnouncements() : listAnnouncements(),
    ]);

    const classMap = new Map<string, string>();
    for (const s of advisorSections) classMap.set(s.sectionId, `${s.gradeName} ${s.sectionName}`);
    for (const o of teachingOfferings) classMap.set(o.sectionId, `${o.gradeName} ${o.sectionName}`);
    const classes = [...classMap.entries()].map(([sectionId, label]) => ({ sectionId, label }));

    return (
      <div>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Notice</h1>
            <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
              Notices from the school and posts you publish to your classes
            </p>
          </div>
          <NoticeFormModal
            classes={classes}
            trigger={
              <button type="button" style={{ border: 0, background: "var(--fac-primary)", color: "#fff", cursor: "pointer", font: "600 14.5px/1 var(--fac-font-sans)", borderRadius: 9, padding: "13px 20px" }}>
                + Post a notice
              </button>
            }
          />
        </div>

        <div style={{ marginTop: 22 }}>
          <Tabs
            items={[
              { key: "all", label: "All notices", href: "/faculty/announcements" },
              { key: "mine", label: "Posted by me", href: "/faculty/announcements?tab=mine" },
            ]}
            activeKey={mineOnly ? "mine" : "all"}
          />
        </div>

        {announcements.length === 0 ? (
          <div style={{ marginTop: 18 }}>
            <FacultyEmptyState message={mineOnly ? "You haven't posted anything yet." : "Nothing has been posted to your classes yet."} />
          </div>
        ) : (
          <div className="flex flex-col gap-3.5" style={{ marginTop: 18 }}>
            {announcements.map((a: Announcement) => (
              <div key={a.id} className="fac-hover-lift" style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "18px 22px" }}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--fac-tint)", color: "var(--fac-primary)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 12px/1 var(--fac-font-sans)" }}>
                    PP
                  </span>
                  <span style={{ font: "600 14.5px/1.2 var(--fac-font-sans)" }}>{a.canEdit ? "You" : "School"}</span>
                  <span style={{ font: "400 13px/1.2 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
                    {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  <span style={{ flex: 1 }} />
                  <span style={{ font: "600 11.5px/1 var(--fac-font-sans)", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 20, padding: "6px 11px" }}>
                    {a.isEmergency ? "EMERGENCY" : a.category ?? "NOTICE"}
                  </span>
                </div>
                <div style={{ font: "700 19px/1.3 var(--fac-font-sans)", marginTop: 13 }}>{a.title}</div>
                <div style={{ font: "400 14.5px/1.55 var(--fac-font-sans)", color: "#475569", marginTop: 6, maxWidth: "78ch" }}>{a.body}</div>
                <div style={{ font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 10 }}>
                  {a.expiresAt ? `Expires ${new Date(a.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "No expiry"}
                </div>
                {a.canEdit && (
                  <div className="flex gap-2.5" style={{ marginTop: 14 }}>
                    <NoticeFormModal
                      classes={classes}
                      announcement={a}
                      trigger={
                        <button type="button" style={{ border: "1px solid var(--fac-border)", background: "var(--fac-white)", color: "var(--fac-body)", cursor: "pointer", font: "600 13px/1 var(--fac-font-sans)", borderRadius: 9, padding: "9px 16px" }}>
                          Edit
                        </button>
                      }
                    />
                    <form action={deleteAnnouncementAction.bind(null, a.id)}>
                      <button type="submit" style={{ border: "1px solid var(--fac-red-bg)", background: "var(--fac-white)", color: "var(--fac-red-text)", cursor: "pointer", font: "600 13px/1 var(--fac-font-sans)", borderRadius: 9, padding: "9px 16px" }}>
                        Delete
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load notices. Nothing was changed -- try again." />;
  }
}
