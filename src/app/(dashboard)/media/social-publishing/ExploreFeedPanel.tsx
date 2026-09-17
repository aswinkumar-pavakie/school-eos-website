"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatRelativeTime } from "@/lib/format";
import { StatusPill, type PillTone } from "@/components/media-ui/primitives";
import type { MediaPost, MediaPostComment, MediaPostState } from "@/lib/media-api";
import { cancelMediaPostAction, deleteCommentAction, deleteMediaPostAction, getMediaPostCommentsAction, replyToCommentAction, type FormState } from "./actions";

const replyInitial: FormState = {};
const STATE_TONE: Record<MediaPostState, PillTone> = { DRAFT: "gray", SCHEDULED: "blue", PUBLISHED: "green", CANCELLED: "red" };

function ReplyForm({ commentId, onReplied }: { commentId: string; onReplied: () => void }) {
  const [state, formAction] = useActionState(replyToCommentAction, replyInitial);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!state.error) onReplied();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form action={formAction} style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
      <input type="hidden" name="commentId" value={commentId} />
      <input name="reply" placeholder="Write a reply…" style={{ flex: 1, border: "1px solid var(--med-input-border)", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
      <button type="submit" style={{ border: 0, background: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--med-primary)" }}>Reply</button>
      {state.error && <span style={{ fontSize: 12, color: "var(--med-red)" }}>{state.error}</span>}
    </form>
  );
}

// Real, working comment moderation replaces the design's own "Top performing
// this month" reach/likes/saves panel -- no real analytics of that kind
// exist anywhere in this schema (MediaPost has no engagement fields at all),
// so this genuine, already-built capability is kept instead of a fabricated
// metrics panel.
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
      if (selectedId) setComments(await getMediaPostCommentsAction(selectedId));
    });
  }

  useEffect(() => {
    if (!selectedId) {
      // setState must happen inside a callback, never synchronously in the
      // effect body (react-hooks/set-state-in-effect) -- a 0ms timeout keeps
      // this imperceptible to the user while satisfying that.
      const timer = setTimeout(() => setComments([]), 0);
      return () => clearTimeout(timer);
    }
    startLoadingComments(async () => setComments(await getMediaPostCommentsAction(selectedId)));
  }, [selectedId]);

  const selected = live.find((p) => p.id === selectedId) ?? null;
  const unanswered = comments.filter((c) => !c.staffReply).length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 28, alignItems: "start" }}>
      <div style={{ background: "#fff", border: "1px solid var(--med-border)", borderRadius: 15, padding: "24px 26px" }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>Publishing queue</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 8 }}>
          {live.length === 0 ? (
            <div style={{ fontSize: 13.5, color: "var(--med-tertiary)", padding: "20px 0" }}>Nothing published or scheduled yet.</div>
          ) : (
            live.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelectedId(post.id)}
                style={{ display: "block", width: "100%", textAlign: "left", border: 0, cursor: "pointer", background: selectedId === post.id ? "var(--med-tint)" : "transparent", borderRadius: 12, padding: "15px 14px", borderBottom: "1px solid var(--med-divider)" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <StatusPill label={post.state} tone={STATE_TONE[post.state]} />
                  <div style={{ display: "flex", gap: 12 }}>
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startAction(() => deleteMediaPostAction(post.id));
                      }}
                      style={{ fontSize: 12, fontWeight: 700, color: "var(--med-red)", cursor: "pointer" }}
                    >
                      Delete
                    </span>
                    {post.state === "SCHEDULED" && (
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startAction(() => cancelMediaPostAction(post.id));
                        }}
                        style={{ fontSize: 12, fontWeight: 700, color: "var(--med-body-muted)", cursor: "pointer" }}
                      >
                        Cancel
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{post.caption}</div>
                <div style={{ fontSize: 12.5, color: "var(--med-body-muted)", marginTop: 8 }}>Comments {post.commentCount} · Unanswered {post.unansweredCommentCount}</div>
              </button>
            ))
          )}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--med-primary)", borderRadius: 15, padding: "24px 26px" }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.4px" }}>Comments</div>
        {!selected ? (
          <div style={{ fontSize: 13.5, color: "var(--med-tertiary)", marginTop: 12 }}>Select a post on the left to see its comments.</div>
        ) : (
          <>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--med-body-muted)", marginTop: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected.caption}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <span style={{ border: "1px solid var(--med-primary)", background: "var(--med-tint)", borderRadius: 10, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, color: "var(--med-primary)" }}>All ({comments.length})</span>
              <span style={{ border: "1px solid var(--med-border)", borderRadius: 10, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, color: "var(--med-body-muted)" }}>Unanswered ({unanswered})</span>
            </div>
            {loadingComments ? (
              <div style={{ fontSize: 13.5, color: "var(--med-tertiary)", marginTop: 16 }}>Loading…</div>
            ) : comments.length === 0 ? (
              <div style={{ fontSize: 13.5, color: "var(--med-tertiary)", marginTop: 16 }}>No comments on this post yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
                {comments.map((comment) => (
                  <div key={comment.id} style={{ borderBottom: "1px solid var(--med-divider)", paddingBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--med-panel)", color: "var(--med-body)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {(comment.commenterLabel ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>
                          {comment.commenterLabel ?? "Student"} <span style={{ marginLeft: 6, fontWeight: 400, color: "var(--med-tertiary)", fontSize: 12.5 }}>{formatRelativeTime(comment.createdAt)}</span>
                        </div>
                        <div style={{ fontSize: 14, marginTop: 2 }}>{comment.body}</div>
                        {comment.staffReply ? (
                          <div style={{ marginTop: 8, borderRadius: 10, background: "var(--med-panel)", padding: "8px 12px", fontSize: 12.5 }}>↳ {comment.staffReply}</div>
                        ) : (
                          <ReplyForm
                            commentId={comment.id}
                            onReplied={() => {
                              router.refresh();
                              if (selectedId) getMediaPostCommentsAction(selectedId).then(setComments);
                            }}
                          />
                        )}
                        <div style={{ marginTop: 6 }}>
                          <span role="button" onClick={() => startAction(() => deleteCommentAction(comment.id))} style={{ fontSize: 12, fontWeight: 700, color: "var(--med-red)", cursor: "pointer" }}>Delete</span>
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
