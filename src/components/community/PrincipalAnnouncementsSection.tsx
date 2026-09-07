// Principal's read-only mirror of AnnouncementsSection -- same announcement
// list, no create/publish/archive controls. These are community-scoped
// announcements (posts within this one community), not the separate,
// school-wide Announcements sidebar module.

import { StatusPill } from "@/components/dashboard/StatusPill";

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  state: string;
  publishedAt: string | null;
}

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "PUBLISHED") return "success";
  if (state === "ARCHIVED") return "critical";
  return "pending";
}

export function PrincipalAnnouncementsSection({ announcements }: { announcements: AnnouncementRow[] }) {
  return (
    <div className="rounded-[16px] border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Announcements</h2>
        <span className="text-xs text-text-muted">{announcements.length} announcements</span>
      </div>

      {announcements.length === 0 && (
        <p className="mt-3 rounded-[11px] border border-dashed border-border bg-field px-3.5 py-3 text-sm text-text-muted">
          No announcements yet.
        </p>
      )}

      <ul className="mt-3 flex flex-col divide-y divide-border">
        {announcements.map((a) => (
          <li key={a.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
            <div>
              <p className="text-[13.5px] font-semibold text-text">{a.title}</p>
              <p className="mt-0.5 text-xs text-text-muted">{a.body}</p>
            </div>
            <StatusPill tone={stateTone(a.state)} label={a.state} />
          </li>
        ))}
      </ul>
    </div>
  );
}
