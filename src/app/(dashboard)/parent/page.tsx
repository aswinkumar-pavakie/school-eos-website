// Parent Dashboard -- real Announcements (SCHOOL + ROLE=PARENT + the
// selected child's own section) and real Media Room published posts, same
// two real feeds the mobile app's own Home screen shows. Every other tile
// links into its own real page; nothing here is fabricated.

import Link from "next/link";
import { AcademicsIcon, BellIcon, AttendanceIcon, RequestsIcon } from "@/components/dashboard/icons";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  getAttendance,
  listAnnouncements,
  listChildren,
  listHomework,
  listPublishedMediaPosts,
  resolveSelectedChild,
} from "@/lib/parent-api";
import { redirect } from "next/navigation";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function ParentDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const [announcements, mediaPosts, attendance, homework] = await Promise.all([
      listAnnouncements(selected.studentId).catch(() => []),
      listPublishedMediaPosts().catch(() => []),
      getAttendance(selected.studentId).catch(() => null),
      listHomework(selected.studentId).catch(() => []),
    ]);

    const latestPost = mediaPosts[0];
    const pendingHomework = homework.filter((h) => h.submissionStatus === "PENDING" || h.submissionStatus === "NOT_DONE").length;

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold leading-[34px] text-text">
              {greeting()}
              {selected.studentName ? `, ${selected.studentName.split(" ")[0]}'s parent` : ""}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join(" ")}
            </p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-[22px] sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            eyebrow="Attendance"
            value={attendance ? `${attendance.summary.percentage}%` : "—"}
            detail={attendance ? `${attendance.summary.presentCount}/${attendance.summary.totalCount} days this month` : "No data yet"}
            icon={<AttendanceIcon className="h-5 w-5" />}
            href={`/parent/attendance?studentId=${selected.studentId}`}
          />
          <KpiCard
            eyebrow="Homework pending"
            value={String(pendingHomework)}
            detail={pendingHomework > 0 ? "Needs attention" : "All caught up"}
            icon={<AcademicsIcon className="h-5 w-5" />}
            href={`/parent/homework?studentId=${selected.studentId}`}
          />
          <KpiCard
            eyebrow="Announcements"
            value={String(announcements.length)}
            detail={announcements.length > 0 ? announcements[0]!.title : "Nothing new"}
            icon={<BellIcon className="h-5 w-5" />}
            href={`/parent/notices?studentId=${selected.studentId}`}
          />
          <KpiCard
            eyebrow="Requests"
            value="View"
            detail="Leave, Documents, Meetings"
            icon={<RequestsIcon className="h-5 w-5" />}
            href={`/parent/leave?studentId=${selected.studentId}`}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-[16px] border border-border bg-surface p-[18px] lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Announcements</h2>
              <Link href={`/parent/notices?studentId=${selected.studentId}`} className="text-[13px] font-semibold text-primary hover:underline">
                View all
              </Link>
            </div>
            {announcements.length === 0 ? (
              <p className="mt-3 text-sm text-text-muted">No announcements yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col divide-y divide-border">
                {announcements.slice(0, 5).map((a) => (
                  <li key={a.id} className="py-3">
                    <p className="text-[13.5px] font-semibold text-text">{a.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-text-muted">{a.body}</p>
                    <p className="mt-1 text-xs text-text-muted">{formatDate(a.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[16px] border border-border bg-surface p-[18px]">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Media Room</h2>
            {!latestPost ? (
              <p className="mt-3 text-sm text-text-muted">No posts yet.</p>
            ) : (
              <div className="mt-3">
                <p className="text-[13.5px] font-bold text-text">{latestPost.caption}</p>
                {latestPost.firstComment ? <p className="mt-2 text-xs text-text-muted">{latestPost.firstComment}</p> : null}
                {latestPost.assets[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={latestPost.assets[0].url} alt="" className="mt-3 h-40 w-full rounded-[var(--radius-card)] object-cover" />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your dashboard. Nothing was changed — try again." />;
  }
}
