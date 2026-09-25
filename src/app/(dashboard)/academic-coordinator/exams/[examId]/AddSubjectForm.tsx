"use client";

import { useActionState, useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/academic-coordinator-ui/primitives";
import type { CoordinatorOffering } from "@/lib/faculty-coordinator-api";
import { createExamSubjectAction, type FormState } from "../actions";

const initialState: FormState = {};

export function AddSubjectForm({ examId, offerings }: { examId: string; offerings: CoordinatorOffering[] }) {
  const [open, setOpen] = useState(false);
  const action = createExamSubjectAction.bind(null, examId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (!open) {
    return (
      <PrimaryButton type="button" onClick={() => setOpen(true)}>
        + Add class
      </PrimaryButton>
    );
  }

  return (
    <form
      action={(fd) => {
        formAction(fd);
      }}
      style={{ background: "var(--acc-surface)", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}
    >
      {state.error && <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--acc-red)" }}>{state.error}</p>}
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13.5, fontWeight: 700, color: "var(--acc-body)" }}>
        Class / subject
        <select name="subjectOfferingId" required style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "12px 13px", fontSize: 14, color: "var(--acc-navy)", background: "#fff" }}>
          <option value="">Select…</option>
          {offerings.map((o) => (
            <option key={o.subjectOfferingId} value={o.subjectOfferingId}>
              {o.gradeName} {o.sectionName} · {o.subjectName}
            </option>
          ))}
        </select>
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13.5, fontWeight: 700, color: "var(--acc-body)" }}>
          Exam date
          <input type="date" name="examDate" style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "11px 12px", fontSize: 14 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13.5, fontWeight: 700, color: "var(--acc-body)" }}>
          Max marks
          <input name="maxMarks" defaultValue="50" style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "11px 12px", fontSize: 14 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13.5, fontWeight: 700, color: "var(--acc-body)" }}>
          Pass marks
          <input name="passMarks" style={{ border: "1px solid var(--acc-border)", borderRadius: 10, padding: "11px 12px", fontSize: 14 }} />
        </label>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <PrimaryButton type="submit" disabled={pending} style={{ height: 38, padding: "0 18px" }}>
          {pending ? "Adding…" : "Add"}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => setOpen(false)} disabled={pending} style={{ height: 38, padding: "0 18px" }}>
          Cancel
        </SecondaryButton>
      </div>
    </form>
  );
}
