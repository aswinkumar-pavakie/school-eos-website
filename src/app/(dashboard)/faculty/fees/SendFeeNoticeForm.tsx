"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFacultyToast } from "@/components/faculty-ui/toast/ToastProvider";
import { sendFeeNoticeAction, type FormState } from "./actions";

const initial: FormState = {};

export function SendFeeNoticeForm({
  sectionId,
  sectionLabel,
  studentsWithDues,
  totalStudents,
}: {
  sectionId: string;
  sectionLabel: string;
  studentsWithDues: number;
  totalStudents: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(sendFeeNoticeAction.bind(null, sectionId), initial);
  const toast = useFacultyToast();
  const prevState = useRef(state);
  const defaultBody = `Dear parent, this is a reminder that ${studentsWithDues} of ${totalStudents} students in Class ${sectionLabel} currently have pending fee dues. Kindly check your ward's fee status and clear any pending balance at the earliest. Thank you.`;

  useEffect(() => {
    if (state !== prevState.current && state.success) {
      toast.show(state.success);
      setOpen(false);
    }
    prevState.current = state;
  }, [state, toast]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ border: 0, cursor: "pointer", background: "var(--fac-primary)", color: "#fff", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 9, padding: "12px 18px" }}
      >
        Send fee notice to all parents
      </button>
    );
  }

  return (
    <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "18px 20px", marginTop: 14 }}>
      <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)" }}>
        FEE NOTICE TO ALL {totalStudents} PARENTS
      </div>
      <p style={{ margin: "6px 0 0", font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
        Posted as a class notice in every parent login · {studentsWithDues} still have pending dues
      </p>
      <form action={formAction} style={{ marginTop: 12 }}>
        <textarea
          name="body"
          defaultValue={defaultBody}
          rows={4}
          style={{ width: "100%", resize: "vertical", border: "1px solid var(--fac-border)", borderRadius: 10, padding: "12px 14px", font: "400 13.5px/1.5 var(--fac-font-sans)", color: "var(--fac-ink)" }}
        />
        {state.error && <p style={{ font: "400 12px/1.3 var(--fac-font-sans)", color: "var(--fac-red-text)", marginTop: 8 }}>{state.error}</p>}
        <div className="flex gap-2.5" style={{ marginTop: 12 }}>
          <button type="submit" style={{ border: 0, cursor: "pointer", background: "var(--fac-primary)", color: "#fff", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 9, padding: "12px 18px" }}>
            Post notice to all parents
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{ border: "1px solid var(--fac-border)", cursor: "pointer", background: "var(--fac-white)", color: "var(--fac-body)", font: "600 14px/1 var(--fac-font-sans)", borderRadius: 9, padding: "12px 18px" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
