"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFacultyToast } from "@/components/faculty-ui/toast/ToastProvider";
import { setRemarkAction, type FormState } from "./actions";

const initial: FormState = {};

// Real write: saves to report_card.advisor_remark via
// PATCH /faculty/class-results/.../students/:studentId/remark
// (faculty-class-results.controller.ts) -- the first application code
// anywhere to touch report_card, see that endpoint's own comment.
export function RemarkForm({
  sectionId,
  examId,
  studentId,
  initialRemark,
}: {
  sectionId: string;
  examId: string;
  studentId: string;
  initialRemark: string;
}) {
  const [state, formAction] = useActionState(setRemarkAction.bind(null, sectionId, examId, studentId), initial);
  const toast = useFacultyToast();
  const prevState = useRef(state);

  useEffect(() => {
    if (state !== prevState.current && !state.error) {
      toast.show("Remark saved");
    }
    prevState.current = state;
  }, [state, toast]);

  return (
    <form action={formAction} key={studentId}>
      <textarea
        name="remark"
        defaultValue={initialRemark}
        placeholder="Write this student's report-card remark..."
        rows={4}
        style={{
          width: "100%",
          resize: "vertical",
          border: "1px solid var(--fac-border)",
          borderRadius: 10,
          padding: "12px 14px",
          font: "400 13.5px/1.5 var(--fac-font-sans)",
          color: "var(--fac-ink)",
          background: "var(--fac-white)",
          outline: "none",
        }}
      />
      <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
        <span style={{ font: "400 11.5px/1.3 var(--fac-font-sans)", color: "var(--fac-red-text)" }}>{state.error ?? ""}</span>
        <button
          type="submit"
          style={{ border: 0, cursor: "pointer", background: "var(--fac-primary)", color: "#fff", font: "600 13px/1 var(--fac-font-sans)", borderRadius: 9, padding: "10px 16px" }}
        >
          Save remark
        </button>
      </div>
    </form>
  );
}
