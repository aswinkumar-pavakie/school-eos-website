"use client";

import { useActionState } from "react";
import { StatusPill, type PillTone } from "@/components/academic-coordinator-ui/primitives";
import type { CoordinatorAttendanceRecord } from "@/lib/faculty-coordinator-api";
import { markAttendanceAction, type FormState } from "./actions";

const initialState: FormState = {};

const STATUS_TONE: Record<string, PillTone> = {
  PRESENT: "green",
  ABSENT: "red",
  LATE: "amber",
  HALF_DAY: "amber",
};

export function AttendanceRecordRow({ sectionId, record, isLocked }: { sectionId: string; record: CoordinatorAttendanceRecord; isLocked: boolean }) {
  const [state, formAction, pending] = useActionState(markAttendanceAction, initialState);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 200px", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--acc-divider-soft)" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--acc-navy)" }}>{[record.firstName, record.lastName].filter(Boolean).join(" ")}</div>
        <div style={{ fontFamily: "var(--acc-font-mono)", fontSize: 12, color: "var(--acc-tertiary)" }}>Roll {record.rollNo ?? "—"}</div>
      </div>
      <StatusPill label={record.status} tone={STATUS_TONE[record.status] ?? "gray"} />
      <form action={formAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="hidden" name="sectionId" value={sectionId} />
        <input type="hidden" name="recordId" value={record.id} />
        <select name="status" defaultValue={record.status} style={{ border: "1px solid var(--acc-border)", borderRadius: 9, padding: "8px 10px", fontSize: 13 }}>
          <option value="PRESENT">Present</option>
          <option value="ABSENT">Absent</option>
          <option value="LATE">Late</option>
          <option value="HALF_DAY">Half day</option>
        </select>
        <button type="submit" disabled={pending} style={{ all: "unset", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "var(--acc-accent)" }}>
          {pending ? "Saving…" : isLocked ? "Correct" : "Save"}
        </button>
      </form>
      {state.error && <div role="alert" style={{ gridColumn: "1 / -1", fontSize: 12, fontWeight: 600, color: "var(--acc-red)" }}>{state.error}</div>}
    </div>
  );
}
