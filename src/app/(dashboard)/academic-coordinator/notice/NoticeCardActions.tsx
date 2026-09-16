"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/academic-coordinator-ui/primitives";
import type { CoordinatorNotice } from "@/lib/faculty-coordinator-api";
import { deleteNoticeAction, updateNoticeAction, type FormState } from "./actions";

const initialState: FormState = {};

export function NoticeCardActions({ notice }: { notice: CoordinatorNotice }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateNoticeAction, initialState);
  const [deleting, startDelete] = useTransition();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) setEditing(false);
    wasPending.current = pending;
  }, [pending, state.error]);

  if (editing) {
    return (
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
        <input type="hidden" name="id" value={notice.id} />
        {state.error && <p role="alert" style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "var(--acc-red)" }}>{state.error}</p>}
        <input name="title" defaultValue={notice.title} required style={{ border: "1px solid var(--acc-border)", borderRadius: 9, padding: "10px 12px", fontSize: 14 }} />
        <textarea name="body" defaultValue={notice.body} required style={{ border: "1px solid var(--acc-border)", borderRadius: 9, padding: "10px 12px", fontSize: 14, minHeight: 80, resize: "vertical" }} />
        <select name="priority" defaultValue={notice.priority} style={{ border: "1px solid var(--acc-border)", borderRadius: 9, padding: "9px 11px", fontSize: 13.5 }}>
          <option value="LOW">Low priority</option>
          <option value="NORMAL">Normal priority</option>
          <option value="HIGH">High priority</option>
          <option value="URGENT">Urgent</option>
        </select>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <SecondaryButton type="button" onClick={() => setEditing(false)} disabled={pending} style={{ padding: "8px 14px", fontSize: 13 }}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={pending} style={{ padding: "8px 14px", fontSize: 13 }}>
            {pending ? "Saving…" : "Save"}
          </PrimaryButton>
        </div>
      </form>
    );
  }

  return (
    <div style={{ display: "flex", gap: 14, marginTop: 11 }}>
      <button
        type="button"
        onClick={() => setEditing(true)}
        style={{ all: "unset", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "var(--acc-accent)" }}
      >
        Edit
      </button>
      <button
        type="button"
        disabled={deleting}
        onClick={() => {
          if (!confirm("Delete this notice? This cannot be undone.")) return;
          startDelete(() => deleteNoticeAction(notice.id));
        }}
        style={{ all: "unset", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "var(--acc-red)" }}
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
