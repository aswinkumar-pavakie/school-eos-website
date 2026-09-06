"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/lib/format";
import type { MediaPost, MediaPostComment } from "@/lib/media-api";
import {
  cancelMediaPostAction,
  deleteCommentAction,
  deleteMediaPostAction,
  getMediaPostCommentsAction,
  replyToCommentAction,
  type FormState,
} from "./actions";

const replyInitial: FormState = {};

function ReplyForm({ commentId, onReplied }: { commentId: string; onReplied: () => void }) {
  const [state, formAction] = useActionState(replyToCommentAction, replyInitial);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!state.error) onReplied();
    // onReplied is stable enough for this purpose; re-running on every parent
    // render would refetch comments needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={formAction} className="mt-2 flex items-center gap-2">
      <input type="hidden" name="commentId" value={commentId} />
      <input
        name="reply"
        placeholder="Write a reply…"
        className="flex-1 rounded-[var(--radius-input)] border border-border bg-field px-3 py-1.5 text-xs text-text outline-none focus:border-primary"
      />
      <button type="submit" className="text-xs font-bold text-primary hover:underline">Reply</button>
      {state.error ? <span className="text-xs text-critical-text">{state.error}</span> : null}
    </form>
  );
}

export function ExploreFeedPanel({ posts }: { posts: MediaPost[] }) {
  const router = useRouter();
  const live = posts.filter((p) => p.state === "PUBLISHED" || p.state === "SCHEDULED");
  const [selectedId, setSelectedId] = useState<string | null>(live[0]?.id ?? null);
  const [comments, setComments] = useState<MediaPostComment[]>([]);
  const [loadingComments, startLoadingComments] = useTransition();
  const [, startTransition] = useTransition();

  function startAction(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
      if (selectedId) {
        const fresh = await getMediaPostCommentsAction(selectedId);
        setComments(fresh);
      }
    });
  }

  useEffect(() => {
    if (!selectedId) {
      setComments([]);
      return;
    }
    startLoadingComments(async () => {
      const result = await getMediaPostCommentsAction(selectedId);
      setComments(result);
    });
  }, [selectedId]);

  const selected = live.find((p) => p.id === selectedId) ?? null;
  const unanswered = comments.filter((c) => !c.staffReply).length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <h2 className="mb-1 text-sm font-bold text-text">Live on Explore</h2>
        <p className="mb-3 text-xs text-text-muted">Select a post to read and moderate its comments</p>
        <div className="flex flex-col gap-3">
          {live.length === 0 ? (
            <p className="text-sm text-text-muted">Nothing published or scheduled yet.</p>
          ) : (
            live.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedId(post.id)}
                className={`rounded-[var(--radius-card)] border p-4 text-left ${selectedId === post.id ? "border-primary bg-field" : "border-border bg-surface"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-field px-2 py-0.5 text-xs font-bold text-text-muted">
                    {post.state === "SCHEDULED" ? "Scheduled" : "Post"}
                  </span>
                  <div className="flex gap-3">
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startAction(() => deleteMediaPostAction(post.id));
                      }}
                      className="text-xs font-bold text-critical-text hover:underline"
                    >
                      Delete
                    </span>
                    {post.state === "SCHEDULED" ? (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startAction(() => cancelMediaPostAction(post.id));
                        }}
                        className="text-xs font-bold text-text-muted hover:underline"
                      >
                        Cancel
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-text">{post.caption}</p>
                <p className="mt-2 text-xs text-text-muted">
                  Comments {post.commentCount} · Unanswered {post.unansweredCommentCount}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-primary bg-surface p-5">
        <h2 className="mb-3 text-sm font-bold text-text">Comments</h2>
        {!selected ? (
          <p className="text-sm text-text-muted">Select a post on the left to see its comments.</p>
        ) : (
          <>
            <p className="mb-3 line-clamp-1 text-xs font-bold text-text-muted">{selected.caption}</p>
            <div className="mb-3 flex gap-2">
              <span className="rounded-[var(--radius-input)] border border-primary bg-field px-3 py-1.5 text-xs font-bold text-primary">All ({comments.length})</span>
              <span className="rounded-[var(--radius-input)] border border-border px-3 py-1.5 text-xs font-bold text-text-muted">Unanswered ({unanswered})</span>
            </div>
            {loadingComments ? (
              <p className="text-sm text-text-muted">Loading…</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-text-muted">No comments on this post yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-field text-xs font-bold text-text-muted">
                        {(comment.commenterLabel ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-text">
                          {comment.commenterLabel ?? "Student"} <span className="ml-1 font-normal text-text-muted">{formatRelativeTime(comment.createdAt)}</span>
                        </p>
                        <p className="text-sm text-text">{comment.body}</p>
                        {comment.staffReply ? (
                          <p className="mt-1 rounded-[var(--radius-input)] bg-field px-3 py-2 text-xs text-text">↳ {comment.staffReply}</p>
                        ) : (
                          <ReplyForm
                            commentId={comment.id}
                            onReplied={() => {
                              router.refresh();
                              if (selectedId) getMediaPostCommentsAction(selectedId).then(setComments);
                            }}
                          />
                        )}
                        <div className="mt-1 flex gap-3">
                          <span
                            role="button"
                            onClick={() => startAction(() => deleteCommentAction(comment.id))}
                            className="text-xs font-bold text-critical-text hover:underline"
                          >
                            Delete
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
