// Notices -- the full Announcements feed for the selected child (SCHOOL +
// ROLE=PARENT + the child's own section), the same real feed the Home
// dashboard's own "View all" link points into.

import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { listAnnouncements, listChildren, resolveSelectedChild } from "@/lib/parent-api";

export default async function ParentNoticesPage({
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

    const announcements = await listAnnouncements(selected.studentId);

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Notices</h1>
            <p className="mt-1 text-sm text-text-muted">
              {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join(" ")}
            </p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        <div className="mt-6">
          {announcements.length === 0 ? (
            <EmptyState title="No notices yet" body="Nothing has been posted for this child yet." />
          ) : (
            <ul className="flex flex-col gap-3">
              {announcements.map((a) => (
                <li
                  key={a.id}
                  className={`rounded-[16px] border-y border-r border-border bg-surface p-[18px] ${
                    a.isEmergency ? "border-l-4 border-l-critical-text" : "border-l border-l-border"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-extrabold leading-[20px] text-text">{a.title}</p>
                      {a.isEmergency ? <StatusPill tone="critical" label="Emergency" /> : null}
                    </div>
                    <div className="flex items-center gap-3">
                      {a.category ? <span className="text-xs font-semibold text-primary">{a.category}</span> : null}
                      <span className="shrink-0 text-xs text-text-muted">{formatDate(a.createdAt)}</span>
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-text">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load notices. Nothing was changed — try again." />;
  }
}
