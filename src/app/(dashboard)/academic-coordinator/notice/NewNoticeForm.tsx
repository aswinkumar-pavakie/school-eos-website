"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/academic-coordinator-ui/primitives";
import type { CoordinatorSection } from "@/lib/faculty-coordinator-api";
import { createNoticeAction, type FormState } from "./actions";

const initialState: FormState = {};

export function NewNoticeForm({ sections }: { sections: CoordinatorSection[] }) {
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<"SECTION" | "COORDINATORS">("SECTION");
  const [state, formAction, pending] = useActionState(createNoticeAction, initialState);
  const wasPending = useRef(false);

  // Close the form only on a real success transition (was submitting, now
  // isn't, and the result carried no error) -- checking `!state.error` alone
  // inside the submit handler would read last render's stale state, since
  // the action itself runs async.
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) setOpen(false);
    wasPending.current = pending;
  }, [pending, state.error]);

  if (!open) {
    return (
      <PrimaryButton type="button" onClick={() => setOpen(true)}>
        + Post a notice
      </PrimaryButton>
    );
  }

  return (
    <form
      action={(fd) => {
        fd.set("audience", audience);
        formAction(fd);
      }}
      style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)" }}>New notice</div>
      {state.error && <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--acc-red)" }}>{state.error}</p>}
      <input name="title" required placeholder="Title" style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "12px 14px", fontSize: 14.5 }} />
      <textarea name="body" required placeholder="Details" style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "12px 14px", fontSize: 14.5, minHeight: 90, resize: "vertical" }} />
      <select name="priority" defaultValue="NORMAL" style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "11px 13px", fontSize: 14 }}>
        <option value="LOW">Low priority</option>
        <option value="NORMAL">Normal priority</option>
        <option value="HIGH">High priority</option>
        <option value="URGENT">Urgent</option>
      </select>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => setAudience("SECTION")}
          style={{ all: "unset", cursor: "pointer", border: `1px solid ${audience === "SECTION" ? "var(--acc-accent)" : "var(--acc-btn-border)"}`, background: audience === "SECTION" ? "var(--acc-accent)" : "#fff", color: audience === "SECTION" ? "#fff" : "var(--acc-body)", borderRadius: 9, padding: "9px 16px", fontSize: 13.5, fontWeight: 700 }}
        >
          Your sections
        </button>
        <button
          type="button"
          onClick={() => setAudience("COORDINATORS")}
          style={{ all: "unset", cursor: "pointer", border: `1px solid ${audience === "COORDINATORS" ? "var(--acc-accent)" : "var(--acc-btn-border)"}`, background: audience === "COORDINATORS" ? "var(--acc-accent)" : "#fff", color: audience === "COORDINATORS" ? "#fff" : "var(--acc-body)", borderRadius: 9, padding: "9px 16px", fontSize: 13.5, fontWeight: 700 }}
        >
          All coordinators
        </button>
      </div>
      {audience === "SECTION" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto", border: "1px solid var(--acc-divider)", borderRadius: 10, padding: 10 }}>
          {sections.map((s) => (
            <label key={s.sectionId} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5 }}>
              <input type="checkbox" name="targetSectionIds" value={s.sectionId} />
              {s.gradeName} {s.sectionName}
            </label>
          ))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <SecondaryButton type="button" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Posting…" : "Post notice"}
        </PrimaryButton>
      </div>
    </form>
  );
}
