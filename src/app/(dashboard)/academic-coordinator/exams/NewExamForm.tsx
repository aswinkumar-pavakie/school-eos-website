"use client";

// The design's own "New exam" form also lets you pick individual classes and
// a full paper order (subjects + per-subject dates) in one screen -- the
// real backend's createCoordinatorExam only takes a name/type/term and a set
// of whole grades (CreateCoordinatorExamDto), with subjects/papers added
// afterward per exam (see [examId]/page.tsx, exactly how the older
// /faculty/coordinator/exams pages already work). This form matches what the
// real endpoint actually accepts; the paper order step happens on the next
// screen once the exam exists.

import { useActionState, useState } from "react";
import { PrimaryButton } from "@/components/academic-coordinator-ui/primitives";
import type { CoordinatorGrade } from "@/lib/faculty-coordinator-api";
import { createExamAction, type FormState } from "./actions";

const EXAM_TYPES = [
  ["UNIT_TEST", "Unit Test"],
  ["MID_TERM", "Mid Term"],
  ["FINAL", "Final"],
  ["OTHER", "Other"],
] as const;

const initialState: FormState = {};

export function NewExamForm({ grades }: { grades: CoordinatorGrade[] }) {
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set());
  const [state, formAction, pending] = useActionState(createExamAction, initialState);

  function toggleGrade(id: string) {
    setSelectedGrades((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <form
      action={(fd) => {
        for (const id of selectedGrades) fd.append("gradeIds", id);
        formAction(fd);
      }}
      style={{ background: "var(--acc-surface)", border: "1px solid var(--acc-border)", borderRadius: "var(--acc-radius-card)", padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--acc-navy)" }}>New exam</div>
      {state.error && <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--acc-red)" }}>{state.error}</p>}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, fontWeight: 700, color: "#334155" }}>
          Classes
          <span style={{ fontSize: 12.5, color: "var(--acc-accent)", fontWeight: 700 }}>{selectedGrades.size} selected</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)", margin: "4px 0 11px" }}>Pick every standard this exam covers</div>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          {grades.map((g) => {
            const on = selectedGrades.has(g.gradeId);
            return (
              <button
                type="button"
                key={g.gradeId}
                onClick={() => toggleGrade(g.gradeId)}
                style={{ all: "unset", cursor: "pointer", border: `1px solid ${on ? "var(--acc-accent)" : "var(--acc-btn-border)"}`, background: on ? "var(--acc-accent)" : "#fff", color: on ? "#fff" : "#334155", borderRadius: 10, padding: "9px 16px", fontSize: 13.5, fontWeight: 700 }}
              >
                {g.gradeName}
              </button>
            );
          })}
        </div>
      </div>

      <label style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 13.5, fontWeight: 700, color: "#334155" }}>
        Exam name
        <input name="name" required placeholder="Unit Test 2" style={{ width: "100%", border: "1px solid var(--acc-border)", borderRadius: 10, padding: "13px 14px", fontSize: 14.5, color: "var(--acc-navy)", outline: "none" }} />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 13.5, fontWeight: 700, color: "#334155" }}>
          Type
          <select name="examType" style={{ width: "100%", border: "1px solid var(--acc-border)", borderRadius: 10, padding: "12px 13px", fontSize: 14.5, color: "var(--acc-navy)", background: "#fff" }}>
            {EXAM_TYPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 13.5, fontWeight: 700, color: "#334155" }}>
          Term (optional)
          <input name="term" placeholder="Term I" style={{ width: "100%", border: "1px solid var(--acc-border)", borderRadius: 10, padding: "12px 13px", fontSize: 14.5, color: "var(--acc-navy)", outline: "none" }} />
        </label>
      </div>

      <PrimaryButton type="submit" disabled={pending} style={{ width: "100%" }}>
        {pending ? "Creating…" : "Create exam"}
      </PrimaryButton>
      <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)" }}>Add subjects and dates for this exam on the next screen.</div>
    </form>
  );
}
