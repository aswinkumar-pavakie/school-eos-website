import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { AuthExpiredError } from "@/lib/api";
import { formatDateTime, orDash } from "@/lib/format";
import { listAdvisorSections, listAnnouncements, listMyAnnouncements, listTeachingOfferings, type Announcement } from "@/lib/faculty-api";
import { AnnouncementModal } from "./AnnouncementModal";
import { deleteAnnouncementAction } from "./actions";

const PRIORITY_TONE: Record<string, string> = {
  URGENT: "bg-critical-bg text-critical-text",
  HIGH: "bg-pending-bg text-pending-text",
  NORMAL: "bg-field text-text-muted",
  LOW: "bg-field text-text-muted",
};

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
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Announcements</h1>
            <p className="mt-1 text-sm text-text-muted">Post to the classes you advise or teach.</p>
          </div>
          <AnnouncementModal classes={classes} />
        </div>

        <div className="flex gap-2 border-b border-border">
          <Link href="/faculty/announcements" className={`px-3 py-2 text-sm font-bold ${!mineOnly ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}>All</Link>
          <Link href="/faculty/announcements?tab=mine" className={`px-3 py-2 text-sm font-bold ${mineOnly ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}>My posts</Link>
        </div>

        {announcements.length === 0 ? (
          <EmptyState title="No announcements" body={mineOnly ? "You haven't posted anything yet." : "Nothing has been posted to your classes yet."} />
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map((a: Announcement) => (
              <div key={a.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-text">{a.title}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{formatDateTime(a.createdAt)}{a.category ? ` · ${a.category}` : ""}</p>
                  </div>
                  <span className={`shrink-0 rounded-[7px] px-2 py-0.5 text-xs font-bold uppercase ${PRIORITY_TONE[a.priority] ?? PRIORITY_TONE.NORMAL}`}>
                    {a.isEmergency ? "Emergency" : a.priority}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-text">{a.body}</p>
                <p className="mt-2 text-xs text-text-muted">
                  Expires {orDash(a.expiresAt ? formatDateTime(a.expiresAt) : null)}
                </p>
                {a.canEdit ? (
                  <div className="mt-3 flex gap-2">
                    <AnnouncementModal classes={classes} announcement={a} />
                    <form action={deleteAnnouncementAction.bind(null, a.id)}>
                      <PlainButton type="submit" variant="danger">Delete</PlainButton>
                    </form>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load announcements. Nothing was changed — try again." />;
  }
}
