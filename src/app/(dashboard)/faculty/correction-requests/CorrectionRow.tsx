"use client";

import { useActionState, useState } from "react";
import type { MarksRosterRow } from "@/lib/faculty-api";
import { correctMarkAction, type FormState } from "./actions";

const initialState: FormState = {};

export function CorrectionRow({ examSubjectId, student }: { examSubjectId: string; student: MarksRosterRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(correctMarkAction, initialState);

  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid var(--fac-divider)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ font: "600 14.5px/1.3 var(--fac-font-sans)" }}>{student.studentName}</div>
          <div style={{ font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
            Roll {student.rollNo ?? "—"} · Current: {student.isAbsent ? "Absent" : (student.marksObtained ?? "—")}
          </div>
        </div>
        {!state.saved && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            style={{ all: "unset", cursor: "pointer", font: "600 12.5px/1 var(--fac-font-sans)", color: "var(--fac-primary)" }}
          >
            {open ? "Cancel" : "Correct"}
          </button>
        )}
        {state.saved && <span style={{ font: "600 12.5px/1 var(--fac-font-sans)", color: "var(--fac-primary)" }}>Saved</span>}
      </div>
      {open && !state.saved && (
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          <input type="hidden" name="examSubjectId" value={examSubjectId} />
          <input type="hidden" name="studentId" value={student.studentId} />
          {state.error && <p role="alert" style={{ margin: 0, font: "600 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-red-text)" }}>{state.error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              name="newMarksObtained"
              type="number"
              defaultValue={student.marksObtained ?? undefined}
              placeholder="New marks"
              required
              style={{ width: 110, border: "1px solid var(--fac-border)", borderRadius: 8, padding: "8px 10px", font: "500 13.5px/1 var(--fac-font-sans)" }}
            />
            <input
              name="reason"
              placeholder="Reason for correction"
              required
              style={{ flex: 1, border: "1px solid var(--fac-border)", borderRadius: 8, padding: "8px 10px", font: "500 13.5px/1 var(--fac-font-sans)" }}
            />
            <button
              type="submit"
              disabled={pending}
              style={{ background: "var(--fac-primary)", color: "#fff", border: 0, borderRadius: 8, padding: "8px 16px", font: "600 13px/1 var(--fac-font-sans)", cursor: "pointer" }}
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
