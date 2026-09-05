"use client";

import { useActionState, useState, useTransition } from "react";
import {
  archiveAnnouncementAction,
  createAnnouncementAction,
  publishAnnouncementAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/community/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  state: string;
  publishedAt: string | null;
}

const initialState: FormActionState = {};

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "PUBLISHED") return "success";
  if (state === "ARCHIVED") return "critical";
  return "pending";
}

export function AnnouncementsSection({ communityId, announcements }: { communityId: string; announcements: AnnouncementRow[] }) {
  const [adding, setAdding] = useState(false);
  const action = createAnnouncementAction.bind(null, communityId);
  const [state, formAction, isPending] = useActionState(action, initialState);

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
          <AnnouncementRowItem key={a.id} communityId={communityId} announcement={a} />
        ))}
      </ul>

      {!adding ? (
        <button type="button" onClick={() => setAdding(true)} className="mt-3 text-[13px] font-semibold text-primary">
          + New announcement
        </button>
      ) : (
        <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
          {state.error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Title *</span>
            <input
              name="title"
              required
              disabled={isPending}
              className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Body *</span>
            <textarea
              name="body"
              required
              rows={3}
              disabled={isPending}
              className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isPending ? "Creating…" : "Create announcement"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function AnnouncementRowItem({ communityId, announcement }: { communityId: string; announcement: AnnouncementRow }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <li className="flex flex-wrap items-start justify-between gap-2 py-3">
      <div>
        <p className="text-[13.5px] font-semibold text-text">{announcement.title}</p>
        <p className="mt-0.5 text-xs text-text-muted">{announcement.body}</p>
        {error && <p className="mt-1 text-xs text-critical-text">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <StatusPill tone={stateTone(announcement.state)} label={announcement.state} />
        {announcement.state === "DRAFT" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await publishAnnouncementAction(communityId, announcement.id);
                setError(result.error);
              })
            }
            className="text-[13px] font-semibold text-primary disabled:opacity-60"
          >
            Publish
          </button>
        )}
        {announcement.state !== "ARCHIVED" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await archiveAnnouncementAction(communityId, announcement.id);
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
