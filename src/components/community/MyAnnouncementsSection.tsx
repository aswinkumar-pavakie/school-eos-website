"use client";

// Community -> Announcements (self-service) client half. Deliberately a
// separate component from AnnouncementsSection (Admin's fuller per-community
// moderation view, which also shows a Publish step for DRAFT rows) -- a
// Community login's own announcements are always created PUBLISHED (see
// actions.ts's own comment), so there is no draft/publish state to surface
// here, matching the mobile app's own Announcements screen exactly (New /
// History tabs, Archive only, no Publish button).

import { useActionState, useState, useTransition } from "react";
import { archiveMyAnnouncementAction, createMyAnnouncementAction, type FormActionState } from "@/app/(dashboard)/community/announcements/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate } from "@/lib/format";

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  state: string;
  publishedAt: string | null;
}

const initialState: FormActionState = {};

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "ARCHIVED") return "critical";
  if (state === "DRAFT") return "pending";
  return "success";
}

export function MyAnnouncementsSection({ communityId, announcements }: { communityId: string; announcements: AnnouncementRow[] }) {
  const [tab, setTab] = useState<"history" | "new">("history");
  const action = createMyAnnouncementAction.bind(null, communityId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("history")}
          className={`px-3.5 py-2.5 text-sm font-semibold ${tab === "history" ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}
        >
          History
        </button>
        <button
          type="button"
          onClick={() => setTab("new")}
          className={`px-3.5 py-2.5 text-sm font-semibold ${tab === "new" ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}
        >
          New
        </button>
      </div>

      {tab === "new" ? (
        <form action={formAction} className="mt-6 flex flex-col gap-3 rounded-[16px] border border-border bg-surface p-6">
          {state.error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Title *</span>
            <input
              name="title"
              required
              disabled={isPending}
              placeholder="e.g. Weekend cleanup drive"
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Message *</span>
            <textarea
              name="body"
              required
              rows={4}
              disabled={isPending}
              placeholder="What do your members need to know?"
              className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none focus:border-primary"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="mt-1 rounded-[11px] bg-primary px-3.5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {isPending ? "Sending…" : "Send announcement"}
          </button>
        </form>
      ) : (
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-6">
          {announcements.length === 0 ? (
            <p className="rounded-[11px] border border-dashed border-border bg-field px-3.5 py-3 text-sm text-text-muted">
              No announcements yet. Send one from the New tab.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {announcements.map((a) => (
                <AnnouncementRowItem key={a.id} announcement={a} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function AnnouncementRowItem({ announcement }: { announcement: AnnouncementRow }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <li className="flex flex-wrap items-start justify-between gap-2 py-3">
      <div>
        <p className="text-[13.5px] font-semibold text-text">{announcement.title}</p>
        <p className="mt-0.5 max-w-[480px] whitespace-pre-wrap text-xs text-text-muted">{announcement.body}</p>
        {announcement.publishedAt && <p className="mt-1 text-xs text-text-muted">{formatDate(announcement.publishedAt)}</p>}
        {error && <p className="mt-1 text-xs text-critical-text">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <StatusPill tone={stateTone(announcement.state)} label={announcement.state} />
        {announcement.state !== "ARCHIVED" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await archiveMyAnnouncementAction(announcement.id);
                setError(result.error);
              })
            }
            className="text-[13px] font-semibold text-critical-text disabled:opacity-60"
          >
            Archive
          </button>
        )}
      </div>
    </li>
  );
}
