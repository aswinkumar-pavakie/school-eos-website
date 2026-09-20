"use client";

import { useState, useTransition } from "react";
import { Card, FieldLabel, GhostButton, PrimaryButton, TextInput } from "@/components/hostel-warden-ui/primitives";
import { useFlash } from "@/components/hostel-warden-ui/FlashContext";
import { MOVEMENT_LOG_PURPOSE_LABELS, MOVEMENT_LOG_PURPOSES, type MovementLogPurpose } from "@/lib/hostel-warden-constants";
import { recordExitAction } from "./actions";

interface StudentOption {
  studentId: string;
  name: string;
  room: string;
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function RecordExitForm({ students, open, onClose }: { students: StudentOption[]; open: boolean; onClose: () => void }) {
  const [studentId, setStudentId] = useState("");
  const [purpose, setPurpose] = useState<MovementLogPurpose>("HOME_LEAVE");
  const [calledByName, setCalledByName] = useState("");
  const [calledByPhone, setCalledByPhone] = useState("");
  const [callTakenAt, setCallTakenAt] = useState(() => toLocalInputValue(new Date()));
  const [leavingAt, setLeavingAt] = useState(() => toLocalInputValue(new Date()));
  const [expectedReturn, setExpectedReturn] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const { showFlash } = useFlash();

  if (!open) return null;

  function reset() {
    setStudentId("");
    setPurpose("HOME_LEAVE");
    setCalledByName("");
    setCalledByPhone("");
    setCallTakenAt(toLocalInputValue(new Date()));
    setLeavingAt(toLocalInputValue(new Date()));
    setExpectedReturn("");
    setError(undefined);
  }

  function submit() {
    if (!studentId) return setError("Select a student.");
    if (!calledByName.trim() || !calledByPhone.trim()) return setError("Enter who called and their phone number.");
    if (!leavingAt || !expectedReturn) return setError("Enter both a leaving time and an expected return time.");
    if (new Date(expectedReturn) <= new Date(leavingAt)) return setError("Expected return must be after the leaving time.");

    startTransition(async () => {
      setError(undefined);
      try {
        await recordExitAction({
          studentId,
          purposeCategory: purpose,
          reason: MOVEMENT_LOG_PURPOSE_LABELS[purpose],
          calledByName: calledByName.trim(),
          calledByPhone: calledByPhone.trim(),
          outFrom: new Date(leavingAt).toISOString(),
          expectedReturn: new Date(expectedReturn).toISOString(),
        });
        showFlash("Exit logged.");
        reset();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "That didn't work. Please try again.");
      }
    });
  }

  const selected = students.find((s) => s.studentId === studentId);

  return (
    <Card style={{ padding: "18px 20px" }}>
      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>Record an exit</h3>
      <p style={{ margin: "4px 0 16px", fontSize: 12.5, color: "var(--hw-text-muted)" }}>
        Fill this in while the parent is on the line. The gate copy and the SMS to the parent both print from this entry.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
        <FieldLabel>
          Student
          <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)} style={{ height: 36 }}>
            <option value="">Select a student</option>
            {students.map((s) => (
              <option key={s.studentId} value={s.studentId}>
                {s.name} · {s.room}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel>
          Room
          <TextInput value={selected?.room ?? ""} readOnly placeholder="—" />
        </FieldLabel>
        <FieldLabel>
          Purpose
          <select className="input" value={purpose} onChange={(e) => setPurpose(e.target.value as MovementLogPurpose)} style={{ height: 36 }}>
            {MOVEMENT_LOG_PURPOSES.map((p) => (
              <option key={p} value={p}>
                {MOVEMENT_LOG_PURPOSE_LABELS[p]}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel>
          Parent who called
          <TextInput value={calledByName} onChange={(e) => setCalledByName(e.target.value)} placeholder="Father · S. Menon" />
        </FieldLabel>
        <FieldLabel>
          Parent phone
          <TextInput value={calledByPhone} onChange={(e) => setCalledByPhone(e.target.value)} placeholder="98450 22104" />
        </FieldLabel>
        <FieldLabel>
          Call taken at
          <input className="input" type="datetime-local" value={callTakenAt} onChange={(e) => setCallTakenAt(e.target.value)} style={{ height: 36 }} />
        </FieldLabel>
        <FieldLabel>
          Leaving at
          <input className="input" type="datetime-local" value={leavingAt} onChange={(e) => setLeavingAt(e.target.value)} style={{ height: 36 }} />
        </FieldLabel>
        <FieldLabel>
          Expected return
          <input className="input" type="datetime-local" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} style={{ height: 36 }} />
        </FieldLabel>
      </div>
      {error && (
        <p role="alert" style={{ margin: "14px 0 0", padding: "10px 14px", borderRadius: 9, background: "var(--hw-red-bg)", color: "var(--hw-red-text)", fontSize: 13, fontWeight: 600 }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <PrimaryButton type="button" onClick={submit} disabled={pending} style={{ height: 34, padding: "0 18px", fontSize: 13 }}>
          {pending ? "Saving…" : "Save to log"}
        </PrimaryButton>
        <GhostButton type="button" onClick={onClose} disabled={pending} style={{ height: 34, fontSize: 13 }}>
          Cancel
        </GhostButton>
      </div>
    </Card>
  );
}
