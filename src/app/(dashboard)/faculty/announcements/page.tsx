// Pixel-rebuilt to match the reference "Notices" screen: underline All/My
// tabs, a single bordered list card (category pill + date on the left,
// author name + state pill on the right, per row), "New notice" primary
// button. Reuses EXISTING real listAnnouncements/listMyAnnouncements/
// create/update/delete unchanged -- createdByName is a real person.display_name
// join (announcement.repository.ts), never a fabricated author.

import { redirect } from "next/navigation";
import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listAdvisorSections, listAnnouncements, listMyAnnouncements, listTeachingOfferings, type Announcement } from "@/lib/faculty-api";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { StatusPill } from "@/components/faculty-ui/StatusPill";
import { NoticeFormModal } from "./NoticeFormModal";
import { deleteAnnouncementAction } from "./actions";

function formatNoticeDate(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

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
            <h1 style={{ margin: 0, font: "700 32px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Notices</h1>
            <p style={{ margin: "8px 0 0", font: "400 14.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
              Circulars from the institution and your department
            </p>
          </div>
          <NoticeFormModal
            classes={classes}
            trigger={
              <button type="button" style={{ border: 0, background: "var(--fac-primary)", color: "#fff", cursor: "pointer", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 9, padding: "12px 18px" }}>
                New notice
              </button>
            }
          />
        </div>

        <div className="flex" style={{ marginTop: 26, borderBottom: "1px solid var(--fac-divider)", gap: 30 }}>
          <Link
            href="/faculty/announcements"
            style={{
              display: "inline-block",
              padding: "0 0 14px",
              marginBottom: -1,
              font: "600 14.5px/1 var(--fac-font-sans)",
              color: mineOnly ? "var(--fac-tertiary)" : "var(--fac-primary)",
              borderBottom: mineOnly ? "2px solid transparent" : "2px solid var(--fac-primary)",
            }}
          >
            All notices
          </Link>
          <Link
            href="/faculty/announcements?tab=mine"
            style={{
              display: "inline-block",
              padding: "0 0 14px",
              marginBottom: -1,
              font: "600 14.5px/1 var(--fac-font-sans)",
              color: mineOnly ? "var(--fac-primary)" : "var(--fac-tertiary)",
              borderBottom: mineOnly ? "2px solid var(--fac-primary)" : "2px solid transparent",
            }}
          >
            My notices
          </Link>
        </div>

        {announcements.length === 0 ? (
          <div style={{ marginTop: 22 }}>
            <FacultyEmptyState message={mineOnly ? "You haven't posted anything yet." : "Nothing has been posted to your classes yet."} />
          </div>
        ) : (
          <div style={{ marginTop: 22, background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", overflow: "hidden" }}>
            {announcements.map((a: Announcement, i) => (
              <div
                key={a.id}
                className="fac-hover-lift"
                style={{ padding: "18px 22px", borderTop: i === 0 ? "none" : "1px solid var(--fac-divider)" }}
              >
                <div className="flex items-center justify-between flex-wrap gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <StatusPill tone={a.isEmergency ? "red" : "blue"} size="sm">
                      {(a.isEmergency ? "EMERGENCY" : (a.category ?? "NOTICE")).toUpperCase()}
                    </StatusPill>
                    <span style={{ font: "400 12.5px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
                      {formatNoticeDate(a.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span style={{ font: "600 13px/1 var(--fac-font-sans)", color: "var(--fac-body)" }}>
                      {a.createdByName ?? (a.canEdit ? "You" : "School")}
                    </span>
                    <StatusPill tone={a.state === "PUBLISHED" ? "blue" : "gray"} size="sm">
                      {a.state}
                    </StatusPill>
                  </div>
                </div>
                <div style={{ font: "700 16px/1.35 var(--fac-font-sans)", marginTop: 11, color: "var(--fac-ink)" }}>{a.title}</div>
                <div
                  style={{
                    font: "400 13.5px/1.5 var(--fac-font-sans)",
                    color: "#475569",
                    marginTop: 5,
                    maxWidth: "82ch",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {a.body}
                </div>
                {a.canEdit && (
                  <div className="flex gap-2.5" style={{ marginTop: 12 }}>
                    <NoticeFormModal
                      classes={classes}
                      announcement={a}
                      trigger={
                        <button type="button" style={{ border: "1px solid var(--fac-border)", background: "var(--fac-white)", color: "var(--fac-body)", cursor: "pointer", font: "600 12.5px/1 var(--fac-font-sans)", borderRadius: 8, padding: "8px 14px" }}>
                          Edit
                        </button>
                      }
                    />
                    <form action={deleteAnnouncementAction.bind(null, a.id)}>
                      <button type="submit" style={{ border: "1px solid var(--fac-red-bg)", background: "var(--fac-white)", color: "var(--fac-red-text)", cursor: "pointer", font: "600 12.5px/1 var(--fac-font-sans)", borderRadius: 8, padding: "8px 14px" }}>
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
