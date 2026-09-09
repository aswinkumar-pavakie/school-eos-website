"use client";

import { useActionState, useState } from "react";
import { Button, PlainButton } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/EmptyState";
import type { MarksExam, MarksRosterRow } from "@/lib/faculty-api";
import { orDash } from "@/lib/format";
import { publishMarksAction, saveMarksAction, type FormState } from "./actions";

const initial: FormState = {};

export function RosterForm({ exam, roster }: { exam: MarksExam; roster: MarksRosterRow[] }) {
  const [state, formAction] = useActionState(saveMarksAction.bind(null, exam.examSubjectId), initial);
  const [absentees, setAbsentees] = useState<Set<string>>(new Set(roster.filter((r) => r.isAbsent).map((r) => r.studentId)));
  const entryOpen = exam.examState === "MARKS_ENTRY";

  return (
    <div className="flex flex-col gap-4">
      {!entryOpen ? (
        <div className="rounded-[var(--radius-card)] border border-pending-text/30 bg-pending-bg px-4 py-3 text-sm text-pending-text">
          Marks entry for &ldquo;{exam.examName}&rdquo; is not open right now (current status: {exam.examState}). You can still view marks below.
        </div>
      ) : null}

      <form action={formAction} className="flex flex-col gap-4">
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead className="bg-field">
              <tr>
                <th className="border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-text-muted">Roll</th>
                <th className="border-b border-border px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-text-muted">Student</th>
                <th className="border-b border-border px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-text-muted">Marks / {exam.maxMarks}</th>
                <th className="border-b border-border px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-text-muted">Absent</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r) => {
                const isAbsent = absentees.has(r.studentId);
                return (
                  <tr key={r.studentId} className="border-b border-border last:border-0 hover:bg-field/60">
                    <td className="px-4 py-2.5 font-mono text-text">{orDash(r.rollNo)}</td>
                    <td className="px-4 py-2.5 text-text">{r.studentName}{r.state ? <span className="ml-2 text-xs text-text-muted">({r.state})</span> : null}</td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        name={`marksObtained__${r.studentId}`}
                        min={0}
                        max={exam.maxMarks}
                        defaultValue={r.marksObtained ?? ""}
                        disabled={!entryOpen || isAbsent}
                        className="w-20 rounded-[var(--radius-input)] border border-border bg-field px-2 py-1.5 text-right text-sm text-text outline-none focus:border-primary disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
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
                        className="h-4 w-4 rounded border-border"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <FieldError message={state.error} />
        {state.success ? <p className="text-sm font-medium text-success-text">{state.success}</p> : null}

        {entryOpen ? <Button variant="primary" pendingLabel="Saving…" className="self-start">Save marks</Button> : null}
      </form>

      {entryOpen ? (
        <form action={publishMarksAction.bind(null, exam.examSubjectId)}>
          <PlainButton type="submit" variant="secondary">Publish marks</PlainButton>
        </form>
      ) : null}
    </div>
  );
}
