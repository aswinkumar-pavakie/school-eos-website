"use client";

import { useState } from "react";
import { FacultyModal } from "@/components/faculty-ui/Modal";
import { useFacultyToast } from "@/components/faculty-ui/toast/ToastProvider";
import type { HomeworkItem } from "@/lib/faculty-api";
import { createHomeworkAction, updateHomeworkAction } from "./actions";

// Pixel-rebuilt "New homework"/"Edit assignment" modal -- reuses the
// EXISTING createHomeworkAction/updateHomeworkAction server actions
// unchanged, called directly (see FacultyRejectModal's comment for why:
// avoids useEffect/ref-during-render lint violations for the close-on-
// success behavior).
export function HomeworkFormModal({
  classes,
  homework,
  trigger,
}: {
  classes: { subjectOfferingId: string; label: string }[];
  homework?: HomeworkItem;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const toast = useFacultyToast();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(undefined);
    const result = homework
      ? await updateHomeworkAction(homework.id, {}, formData)
      : await createHomeworkAction({}, formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    toast.show(homework ? "Homework updated" : "Homework published to parents");
    setOpen(false);
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <FacultyModal open={open} onClose={() => setOpen(false)} title={homework ? "Edit assignment" : "New homework"} subtitle="Parents of the class see this and mark completion">
        <form action={handleSubmit} style={{ marginTop: 4 }}>
          {!homework && (
            <>
              <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", margin: "20px 0 8px" }}>CLASS</div>
              <select
                name="subjectOfferingId"
                required
                defaultValue=""
                style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)", background: "var(--fac-white)", color: "var(--fac-body)" }}
              >
                <option value="" disabled>
                  Select…
                </option>
                {classes.map((c) => (
                  <option key={c.subjectOfferingId} value={c.subjectOfferingId}>
                    {c.label}
                  </option>
                ))}
              </select>
            </>
          )}
          <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", margin: "16px 0 8px" }}>TITLE</div>
          <input
            name="title"
            defaultValue={homework?.title}
            required
            placeholder="e.g. Exercise 6.4, questions 1–10"
            style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }}
          />
          <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", margin: "16px 0 8px" }}>INSTRUCTIONS</div>
          <textarea
            name="description"
            defaultValue={homework?.description ?? ""}
            placeholder="What students must do, notebook, submission mode…"
            style={{ width: "100%", minHeight: 92, border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1.6 var(--fac-font-sans)", resize: "vertical" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
            <div>
              <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", marginBottom: 8 }}>DUE DATE</div>
              <input
                type="date"
                name="dueDate"
                defaultValue={homework?.dueDate.slice(0, 10)}
                required
                style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "12px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }}
              />
            </div>
            <div>
              <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", marginBottom: 8 }}>MAX MARKS</div>
              <input
                type="number"
                min={1}
                name="maxMarks"
                defaultValue={homework?.maxMarks ?? ""}
                placeholder="optional"
                style={{ width: "100%", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "12px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }}
              />
            </div>
          </div>
          {error && <p style={{ font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-red-text)", marginTop: 10 }}>{error}</p>}
          <button
            type="submit"
            disabled={pending}
            style={{ width: "100%", marginTop: 18, border: 0, cursor: "pointer", borderRadius: 11, padding: 15, font: "600 15.5px/1 var(--fac-font-sans)", color: "#fff", background: "var(--fac-primary)", opacity: pending ? 0.7 : 1 }}
          >
            {pending ? "Saving…" : homework ? "Save changes" : "Publish homework"}
          </button>
        </form>
      </FacultyModal>
    </>
  );
}
