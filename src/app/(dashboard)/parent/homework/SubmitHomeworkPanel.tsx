"use client";

import { useActionState, useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/parent-ui/primitives";
import type { ParentHomework } from "@/lib/parent-api";
import { submitHomeworkAction, type FormState } from "./actions";

const initial: FormState = {};

export function SubmitHomeworkPanel({ studentId, homework }: { studentId: string; homework: ParentHomework }) {
  const [open, setOpen] = useState(false);
  const action = submitHomeworkAction.bind(null, studentId, homework.id);
  const [state, formAction] = useActionState(action, initial);
  const alreadySubmitted = homework.submissionStatus === "SUBMITTED" || homework.submissionStatus === "LATE";

  if (!open) {
    return (
      <PrimaryButton type="button" onClick={() => setOpen(true)} style={alreadySubmitted ? { background: "#fff", color: "var(--par-navy)", border: "1px solid var(--par-border)" } : undefined}>
        {alreadySubmitted ? "Update submission" : "Submit homework"}
      </PrimaryButton>
    );
  }

  return (
    <form action={formAction} style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 10 }}>
      <textarea
        name="note"
        rows={3}
        defaultValue={homework.note ?? ""}
        placeholder="Note (optional)"
        style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-input)", padding: "12px 14px", fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
      />
      <input
        name="files"
        type="file"
        multiple
        accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
        style={{ fontSize: 13 }}
      />
      {state.error && (
        <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--par-red-bg)", color: "var(--par-red)", fontSize: 13, fontWeight: 600 }}>
          {state.error}
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
        <PrimaryButton type="submit">{alreadySubmitted ? "Save changes" : "Submit"}</PrimaryButton>
      </div>
    </form>
  );
}
