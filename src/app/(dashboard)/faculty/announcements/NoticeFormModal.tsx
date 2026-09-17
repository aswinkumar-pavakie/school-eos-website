"use client";

import { useState } from "react";
import { FacultyModal } from "@/components/faculty-ui/Modal";
import { useFacultyToast } from "@/components/faculty-ui/toast/ToastProvider";
import type { Announcement } from "@/lib/faculty-api";
import { createAnnouncementAction, updateAnnouncementAction } from "./actions";

// Pixel-rebuilt "Post a notice" modal -- reuses EXISTING
// createAnnouncementAction/updateAnnouncementAction unchanged. "Post notice"
// is disabled until at least one audience is checked AND title is non-empty,
// matching the design's real validation intent (createAnnouncementAction
// itself already enforces "at least one class" server-side too).
export function NoticeFormModal({
  classes,
  announcement,
  trigger,
}: {
  classes: { sectionId: string; label: string }[];
  announcement?: Announcement;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(announcement?.audiences.filter((a) => a.audienceType === "SECTION" && a.targetId).map((a) => a.targetId as string) ?? []),
  );
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const toast = useFacultyToast();
  const ready = title.trim().length > 0 && selected.size > 0;

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(undefined);
    const result = announcement
      ? await updateAnnouncementAction(announcement.id, {}, formData)
      : await createAnnouncementAction({}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.show(announcement ? "Notice updated" : "Notice posted");
    setOpen(false);
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <FacultyModal open={open} onClose={() => setOpen(false)} title={announcement ? "Edit notice" : "Post a notice"} width={520}>
        <form action={handleSubmit} style={{ marginTop: 4 }}>
          <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", margin: "16px 0 8px" }}>TITLE</div>
          <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }} />
          <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", margin: "16px 0 8px" }}>DETAILS</div>
          <textarea name="body" defaultValue={announcement?.body} required style={{ width: "100%", minHeight: 96, border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1.6 var(--fac-font-sans)", resize: "vertical" }} />
          <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", margin: "16px 0 8px" }}>TARGET AUDIENCE</div>
          <div style={{ border: "1px solid var(--fac-border)", borderRadius: 11, maxHeight: 200, overflow: "auto" }}>
            {classes.length === 0 ? (
              <div style={{ padding: 16, font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>You have no classes to send to.</div>
            ) : (
              classes.map((c) => {
                const checked = selected.has(c.sectionId);
                return (
                  <label key={c.sectionId} className="flex items-center gap-3" style={{ padding: "12px 14px", borderBottom: "1px solid var(--fac-divider)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      name="targetSectionIds"
                      value={c.sectionId}
                      checked={checked}
                      onChange={(e) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(c.sectionId);
                          else next.delete(c.sectionId);
                          return next;
                        });
                      }}
                    />
                    <span style={{ font: "500 14.5px/1 var(--fac-font-sans)" }}>{c.label}</span>
                  </label>
                );
              })
            )}
          </div>
          {error && <p style={{ font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-red-text)", marginTop: 10 }}>{error}</p>}
          <button
            type="submit"
            disabled={!ready || pending}
            style={{ width: "100%", marginTop: 18, border: 0, cursor: ready ? "pointer" : "not-allowed", borderRadius: 11, padding: 15, font: "600 15.5px/1 var(--fac-font-sans)", color: "#fff", background: ready ? "var(--fac-primary)" : "var(--fac-outline-hover)" }}
          >
            {pending ? "Posting…" : "Post notice"}
          </button>
        </form>
      </FacultyModal>
    </>
  );
}
