"use client";

import { useActionState } from "react";
import { PrimaryButton, StatusPill } from "@/components/academic-coordinator-ui/primitives";
import type { CoordinatorExam } from "@/lib/faculty-coordinator-api";
import { setMarksWindowAction, type FormState } from "./actions";

const initialState: FormState = {};

function toLocalDate(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function windowStatus(opensAt: string | null, closesAt: string | null): { label: string; tone: "blue" | "green" | "red" | "gray" } {
  if (!opensAt && !closesAt) return { label: "No window set", tone: "gray" };
  const now = Date.now();
  if (opensAt && now < new Date(opensAt).getTime()) return { label: "Not yet open", tone: "gray" };
  if (closesAt && now > new Date(closesAt).getTime()) return { label: "Closed", tone: "red" };
  return { label: "Open", tone: "green" };
}

export function MarksWindowRow({ exam }: { exam: CoordinatorExam }) {
  const [state, formAction, pending] = useActionState(setMarksWindowAction, initialState);
  const status = windowStatus(exam.marksEntryOpensAt, exam.marksEntryClosesAt);

  return (
    <form
      action={formAction}
      style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 110px", gap: 12, alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--acc-divider-soft)" }}
    >
      <input type="hidden" name="examId" value={exam.examId} />
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--acc-navy)" }}>{exam.name}</div>
          <StatusPill label={status.label} tone={status.tone} />
        </div>
        <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)", marginTop: 2 }}>
          {exam.gradeNames.join(", ")} · {exam.state}
        </div>
        {state.error && <div role="alert" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--acc-red)", marginTop: 4 }}>{state.error}</div>}
        {state.saved && <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--acc-green)", marginTop: 4 }}>Saved.</div>}
      </div>
      <input
        type="date"
        name="opensAt"
        defaultValue={toLocalDate(exam.marksEntryOpensAt)}
        style={{ border: "1px solid var(--acc-border)", borderRadius: 9, padding: "9px 11px", fontSize: 13.5 }}
      />
      <input
        type="date"
        name="closesAt"
        defaultValue={toLocalDate(exam.marksEntryClosesAt)}
        style={{ border: "1px solid var(--acc-border)", borderRadius: 9, padding: "9px 11px", fontSize: 13.5 }}
      />
      <PrimaryButton type="submit" disabled={pending} style={{ padding: "9px 14px", fontSize: 13 }}>
        {pending ? "Saving…" : "Save"}
      </PrimaryButton>
    </form>
  );
}
