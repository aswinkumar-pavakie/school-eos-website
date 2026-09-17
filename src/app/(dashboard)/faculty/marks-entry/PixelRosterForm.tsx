"use client";

import { useActionState, useState } from "react";
import type { MarksExam, MarksRosterRow } from "@/lib/faculty-api";
import { Avatar } from "@/components/faculty-ui/Avatar";
import { publishMarksAction, saveMarksAction, type FormState } from "./actions";

const initial: FormState = {};

// Pixel-rebuilt roster -- reuses EXISTING saveMarksAction/publishMarksAction
// server actions unchanged. The design's "submit to coordinator ->
// verification -> sent back" 3-state workflow has no backend logic yet (real
// gap, see the plan) -- Publish stays wired to the real, working 2-state
// (open -> published) flow exactly as before; no fake 3rd state is added.
export function PixelRosterForm({ exam, roster }: { exam: MarksExam; roster: MarksRosterRow[] }) {
  const [state, formAction] = useActionState(saveMarksAction.bind(null, exam.examSubjectId), initial);
  const [absentees, setAbsentees] = useState<Set<string>>(new Set(roster.filter((r) => r.isAbsent).map((r) => r.studentId)));
  const entryOpen = exam.examState === "MARKS_ENTRY";

  const entered = roster.filter((r) => r.marksObtained !== null || absentees.has(r.studentId)).length;
  const marksOnly = roster.filter((r) => r.marksObtained !== null).map((r) => r.marksObtained!);
  const avg = marksOnly.length > 0 ? Math.round((marksOnly.reduce((a, b) => a + b, 0) / marksOnly.length) * 10) / 10 : null;

  return (
    <div>
      {!entryOpen && (
        <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 22, marginTop: 16, font: "400 15px/1.5 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
          Marks entry for &ldquo;{exam.examName}&rdquo; is not open right now (status: {exam.examState}). You can still view marks below.
        </div>
      )}

      <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "20px 22px", marginTop: 16, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)" }}>ENTERED</div>
          <div style={{ font: "700 30px/1.1 var(--fac-font-sans)", marginTop: 8 }}>{entered} / {roster.length}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)" }}>CLASS AVG</div>
          <div style={{ font: "700 30px/1.1 var(--fac-font-sans)", marginTop: 8 }}>{avg ?? "--"}</div>
        </div>
      </div>

      <form action={formAction}>
        <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", marginTop: 16, overflow: "hidden" }}>
          <div className="flex justify-between" style={{ padding: "16px 22px", borderBottom: "1px solid var(--fac-divider)" }}>
            <span style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)" }}>MARKS</span>
            <span style={{ font: "500 13px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Max {exam.maxMarks}</span>
          </div>
          <div style={{ maxHeight: 520, overflow: "auto" }}>
            {roster.map((r) => {
              const isAbsent = absentees.has(r.studentId);
              return (
                <div key={r.studentId} className="fac-hover-lift flex items-center gap-3.5" style={{ padding: "11px 22px", borderBottom: "1px solid var(--fac-divider)" }}>
                  <Avatar initials={r.studentName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()} size="sm" />
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", font: "600 14.5px/1.3 var(--fac-font-sans)" }}>{r.studentName}</span>
                    <span style={{ display: "block", font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>Roll {r.rollNo ?? "--"}</span>
                  </span>
                  <label className="flex items-center gap-1.5" style={{ font: "400 12px/1 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
                    <input
                      type="checkbox"
                      name={`isAbsent__${r.studentId}`}
                      defaultChecked={isAbsent}
                      disabled={!entryOpen}
                      onChange={(e) =>
                        setAbsentees((prev) => {
                          const next = new Set(prev);
                          if (e.currentTarget.checked) next.add(r.studentId);
                          else next.delete(r.studentId);
                          return next;
                        })
                      }
                    />
                    Absent
                  </label>
                  {entryOpen ? (
                    <input
                      type="number"
                      name={`marksObtained__${r.studentId}`}
                      min={0}
                      max={exam.maxMarks}
                      defaultValue={r.marksObtained ?? ""}
                      disabled={isAbsent}
                      className="fac-font-mono"
                      style={{ width: 78, border: "1px solid var(--fac-border)", borderRadius: 9, padding: 11, textAlign: "center", font: "600 15px/1 var(--fac-font-mono)", color: "var(--fac-ink)", opacity: isAbsent ? 0.5 : 1 }}
                    />
                  ) : (
                    <span className="fac-font-mono" style={{ width: 78, background: "var(--fac-panel)", borderRadius: 9, padding: 11, textAlign: "center", font: "600 15px/1 var(--fac-font-mono)", color: "var(--fac-body-muted)" }}>
                      {r.marksObtained ?? "--"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {entryOpen && (
            <div style={{ padding: "18px 22px" }}>
              <button type="submit" style={{ border: "1px solid var(--fac-border)", background: "var(--fac-white)", color: "var(--fac-body)", cursor: "pointer", font: "600 15px/1 var(--fac-font-sans)", borderRadius: 11, padding: "15px 26px" }}>
                Save draft
              </button>
            </div>
          )}
        </div>
      </form>
      {state.error && <p style={{ font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-red-text)", marginTop: 10 }}>{state.error}</p>}
      {state.success && <p style={{ font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-green-text)", marginTop: 10 }}>{state.success}</p>}
      {/* Sibling form, never nested inside the roster <form> above -- HTML forbids nested forms. */}
      {entryOpen && (
        <form action={publishMarksAction.bind(null, exam.examSubjectId)} style={{ marginTop: 12 }}>
          <button type="submit" style={{ width: "100%", border: 0, background: "var(--fac-primary)", color: "#fff", cursor: "pointer", font: "600 15.5px/1 var(--fac-font-sans)", borderRadius: 11, padding: 15 }}>
            Publish marks
          </button>
        </form>
      )}
    </div>
  );
}
