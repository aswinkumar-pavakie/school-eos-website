"use client";

import { useMemo, useState, useTransition } from "react";
import { PrimaryButton, SecondaryButton, StatusPill } from "@/components/hostel-warden-ui/primitives";
import { useFlash } from "@/components/hostel-warden-ui/FlashContext";
import type { NightAttendanceRosterRow, NightAttendanceStatus } from "@/lib/hostel-warden-api";
import { markNightAttendanceAction } from "./actions";

export function NightRosterMarker({ date, roster }: { date: string; roster: NightAttendanceRosterRow[] }) {
  const [marks, setMarks] = useState<Record<string, NightAttendanceStatus>>(() => {
    const initial: Record<string, NightAttendanceStatus> = {};
    for (const r of roster) if (r.status) initial[r.studentId] = r.status;
    return initial;
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const { showFlash } = useFlash();

  const markedCount = useMemo(() => Object.keys(marks).length, [marks]);

  function markAllPresent() {
    const next: Record<string, NightAttendanceStatus> = {};
    for (const r of roster) next[r.studentId] = "PRESENT";
    setMarks(next);
  }

  function submit() {
    startTransition(async () => {
      setError(undefined);
      try {
        const entries = Object.entries(marks).map(([studentId, status]) => ({ studentId, status }));
        await markNightAttendanceAction(date, entries);
        showFlash(`Roll call saved -- ${entries.length} of ${roster.length} students marked.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "That didn't work. Please try again.");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SecondaryButton type="button" onClick={markAllPresent} disabled={pending}>
          Mark all present
        </SecondaryButton>
        <span style={{ fontSize: 12.5, color: "var(--hw-text-muted)" }}>{markedCount} of {roster.length} marked</span>
        <span style={{ flex: 1 }} />
        <PrimaryButton type="button" onClick={submit} disabled={pending || markedCount === 0}>
          {pending ? "Saving…" : "Save roll call"}
        </PrimaryButton>
      </div>
      {error && <p role="alert" style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "var(--hw-red-text)" }}>{error}</p>}

      <div style={{ display: "flex", flexDirection: "column" }}>
        {roster.map((r) => {
          const mark = marks[r.studentId];
          return (
            <div key={r.studentId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 4px", borderBottom: "1px solid var(--hw-divider-soft)" }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{[r.firstName, r.lastName].filter(Boolean).join(" ")}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--hw-text-faint)" }}>
                  {r.admissionNo} · {r.roomNo ?? "—"} {r.blockName ? `· ${r.blockName}` : ""}
                </span>
              </span>
              {r.hasApprovedLeaveToday && <StatusPill label="On approved leave" tone="blue" />}
              <div style={{ display: "inline-flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setMarks((prev) => ({ ...prev, [r.studentId]: "PRESENT" }))}
                  style={{ all: "unset", cursor: "pointer", padding: "6px 14px", borderRadius: 7, fontSize: 12.5, fontWeight: 700, border: `1px solid ${mark === "PRESENT" ? "var(--hw-accent)" : "var(--hw-divider)"}`, background: mark === "PRESENT" ? "var(--hw-accent)" : "#fff", color: mark === "PRESENT" ? "#fff" : "var(--hw-text-muted)" }}
                >
                  Present
                </button>
                <button
                  type="button"
                  onClick={() => setMarks((prev) => ({ ...prev, [r.studentId]: "ABSENT" }))}
                  style={{ all: "unset", cursor: "pointer", padding: "6px 14px", borderRadius: 7, fontSize: 12.5, fontWeight: 700, border: `1px solid ${mark === "ABSENT" ? "var(--hw-red-strong)" : "var(--hw-divider)"}`, background: mark === "ABSENT" ? "var(--hw-red-strong)" : "#fff", color: mark === "ABSENT" ? "#fff" : "var(--hw-text-muted)" }}
                >
                  Absent
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
