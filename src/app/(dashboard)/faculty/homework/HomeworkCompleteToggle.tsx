"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFacultyToast } from "@/components/faculty-ui/toast/ToastProvider";
import { gradeSubmissionAction, type FormState } from "./actions";

const initial: FormState = {};

// Real write: PATCH /faculty/homework/:id/roster/:studentId
// (faculty-homework.controller.ts) -- lets the teacher mark a submission
// complete/not complete themselves (homework checked in class, not
// necessarily submitted through the Parent app), the first application code
// anywhere to do this -- see that endpoint's own comment.
export function HomeworkCompleteToggle({
  homeworkId,
  studentId,
  status,
  marksAwarded,
}: {
  homeworkId: string;
  studentId: string;
  status: string;
  marksAwarded: number | null;
}) {
  const isDone = status === "SUBMITTED" || status === "LATE" || status === "GRADED";
  const [state, formAction] = useActionState(
    gradeSubmissionAction.bind(null, homeworkId, studentId, isDone ? "NOT_DONE" : "SUBMITTED"),
    initial,
  );
  const toast = useFacultyToast();
  const prevState = useRef(state);

  useEffect(() => {
    if (state !== prevState.current && !state.error) {
      toast.show(isDone ? "Marked not complete" : "Marked complete");
    }
    prevState.current = state;
  }, [state, toast, isDone]);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          border: "1px solid var(--fac-border)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          font: "600 12px/1 var(--fac-font-sans)",
          background: isDone ? "var(--fac-primary)" : "var(--fac-white)",
          color: isDone ? "#fff" : "var(--fac-tertiary)",
        }}
        title={isDone ? "Mark not complete" : "Mark complete"}
      >
        {isDone ? "✓" : ""}
      </button>
      {state.error && <span style={{ font: "400 11px/1.3 var(--fac-font-sans)", color: "var(--fac-red-text)" }}>{state.error}</span>}
      {marksAwarded !== null && <span style={{ font: "400 12px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>{marksAwarded} marks</span>}
    </form>
  );
}
