"use client";

// "Posts to parents" -- pixel-matched to the reference's own panel (kind
// badge, timestamp, title, body). Real /communities/:id/announcements data,
// via this module's own createAnnouncementAction (now publishes immediately,
// matching the reference's single-step "+ New post").

import { useActionState } from "react";
import { createAnnouncementAction, type FormActionState } from "@/app/(dashboard)/admin/community/actions";
import { formatRelativeTime } from "@/lib/format";

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  state: string;
  publishedAt: string | null;
}

const initialState: FormActionState = {};

// Controlled by the detail page's own header "+ New post" button (see the
// reference markup: openClubPost lives next to the club title, not inside
// this panel), not an internal trigger of its own.
export function PostsToParentsPanel({
  communityId,
  announcements,
  open,
  onClose,
}: {
  communityId: string;
  announcements: AnnouncementRow[];
  open: boolean;
  onClose: () => void;
}) {
  const action = createAnnouncementAction.bind(null, communityId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  const published = announcements.filter((a) => a.state === "PUBLISHED");

  return (
    <div className="card-hover mt-4 rounded-[14px] border border-border bg-surface p-[22px]">
      <h3 className="text-[17px] font-bold text-text">Posts to parents</h3>

      {open && (
        <form action={formAction} className="mt-3.5 flex flex-col gap-2.5 rounded-[11px] bg-field p-3.5">
          {state.error && <p className="text-xs font-semibold text-critical-text">{state.error}</p>}
          <input
            name="title"
            required
            disabled={isPending}
            placeholder="Post title"
            className="rounded-[9px] border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
          />
          <textarea
            name="body"
            required
            rows={3}
            disabled={isPending}
            placeholder="What should parents know?"
            className="rounded-[9px] border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-[9px] border border-border px-3 py-1.5 text-[12.5px] font-bold text-text hover:bg-surface">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="rounded-[9px] bg-primary px-3 py-1.5 text-[12.5px] font-bold text-white disabled:opacity-60">
              {isPending ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      )}

      {published.length === 0 ? (
        <p className="pt-2.5 text-[13px] text-text-muted">No posts yet · new posts appear here and on the parent notice board</p>
      ) : (
        <div className="mt-3.5 grid gap-3.5">
          {published.map((p) => (
            <div key={p.id} className="rounded-[12px] border border-border px-[18px] py-4">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <span className="rounded-[6px] bg-primary/10 px-2 py-[3px] text-[11px] font-bold text-primary">CLUB POST</span>
                <span className="text-[12.5px] text-text-muted">{p.publishedAt ? formatRelativeTime(p.publishedAt) : ""}</span>
              </div>
              <div className="mt-2.5 text-[16px] font-bold text-text">{p.title}</div>
              <div className="mt-1.5 text-sm leading-[1.6] text-text-secondary">{p.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
