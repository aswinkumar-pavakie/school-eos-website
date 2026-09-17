"use client";

import { useActionState, useState } from "react";
import { PrimaryButton } from "@/components/academic-coordinator-ui/primitives";
import type { SubstituteGap } from "@/lib/faculty-coordinator-api";
import { assignSubstitutionAction, type FormState } from "./actions";

const initialState: FormState = {};

export function GapCard({ gap, date }: { gap: SubstituteGap; date: string }) {
  const [expanded, setExpanded] = useState(false);
  const [state, formAction, pending] = useActionState(assignSubstitutionAction, initialState);
  const top = gap.candidates[0];
  const others = gap.candidates.slice(1);

  return (
    <div style={{ background: "#fff", border: "1px solid var(--acc-border)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "18px 20px" }}>
        <div style={{ width: 56, flex: "0 0 56px", textAlign: "center", background: "var(--acc-panel)", borderRadius: 10, padding: "8px 0" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--acc-navy)", lineHeight: 1 }}>{gap.periodNo}</div>
          <div style={{ fontSize: 9.5, letterSpacing: "0.08em", color: "var(--acc-tertiary)", marginTop: 3 }}>PERIOD</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16.5, fontWeight: 800, color: "var(--acc-navy)" }}>
            Class {gap.gradeName} {gap.sectionName} · {gap.subjectName}
          </div>
          <div style={{ fontSize: 13, color: "var(--acc-body-muted)", marginTop: 4 }}>
            {gap.startTime.slice(0, 5)} · {gap.absentTeacherName} away
          </div>
        </div>
      </div>

      {gap.assignedSubstituteStaffId ? (
        <div style={{ padding: "14px 20px", background: "#fff", borderTop: "1px solid var(--acc-divider-soft)" }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--acc-navy)" }}>
            {gap.candidates.find((c) => c.staffId === gap.assignedSubstituteStaffId)?.name ?? "Substitute assigned"}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--acc-body-muted)" }}>Covering {gap.subjectName}</div>
        </div>
      ) : top ? (
        <>
          <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 20px", background: "#fff", borderTop: "1px solid var(--acc-divider-soft)", flexWrap: "wrap" }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: "var(--acc-accent-tint)", color: "var(--acc-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700 }}>
              {top.name.slice(0, 1)}
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--acc-navy)" }}>{top.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--acc-body-muted)" }}>{top.weeklyPeriods} periods/wk · lowest load</div>
            </div>
            <form action={formAction}>
              <input type="hidden" name="timetableSlotId" value={gap.timetableSlotId} />
              <input type="hidden" name="originalStaffId" value={gap.absentStaffId} />
              <input type="hidden" name="substituteStaffId" value={top.staffId} />
              <input type="hidden" name="subDate" value={date} />
              <PrimaryButton type="submit" disabled={pending} style={{ padding: "10px 20px", fontSize: 13.5 }}>
                {pending ? "Assigning…" : "Assign"}
              </PrimaryButton>
            </form>
          </div>
          {state.error && <div role="alert" style={{ padding: "0 20px 10px", fontSize: 12.5, fontWeight: 600, color: "var(--acc-red)" }}>{state.error}</div>}
          {others.length > 0 && (
            <div onClick={() => setExpanded((e) => !e)} style={{ padding: "13px 20px", borderTop: "1px solid var(--acc-divider-soft)", fontSize: 13.5, color: "var(--acc-accent)", fontWeight: 700, cursor: "pointer" }}>
              {expanded ? "Hide other options" : `${others.length} other option${others.length === 1 ? "" : "s"}`}
            </div>
          )}
          {expanded && (
            <div style={{ background: "#fff", borderTop: "1px solid var(--acc-divider-soft)", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.08em", color: "var(--acc-tertiary)", fontWeight: 700 }}>FREE THIS PERIOD · RANKED BY LOAD</div>
              {others.map((c) => (
                <form key={c.staffId} action={formAction} style={{ display: "flex", alignItems: "center", gap: 13, background: "#fff", border: "1px solid var(--acc-border)", borderRadius: 11, padding: "13px 15px" }}>
                  <input type="hidden" name="timetableSlotId" value={gap.timetableSlotId} />
                  <input type="hidden" name="originalStaffId" value={gap.absentStaffId} />
                  <input type="hidden" name="substituteStaffId" value={c.staffId} />
                  <input type="hidden" name="subDate" value={date} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--acc-navy)" }}>{c.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--acc-body-muted)" }}>{c.weeklyPeriods} periods/wk</div>
                  </div>
                  <button type="submit" disabled={pending} style={{ all: "unset", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--acc-accent)" }}>
                    Pick
                  </button>
                </form>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: "14px 20px", background: "#fff", borderTop: "1px solid var(--acc-divider-soft)", fontSize: 13.5, color: "var(--acc-tertiary)" }}>
          No free teacher available this period.
        </div>
      )}
    </div>
  );
}
