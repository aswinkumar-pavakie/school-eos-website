"use client";

import { useState, useTransition } from "react";
import { Card, FieldLabel, GhostButton, PrimaryButton, TextInput } from "@/components/hostel-warden-ui/primitives";
import { useFlash } from "@/components/hostel-warden-ui/FlashContext";
import { recordLeaveAction } from "./actions";

interface StudentOption {
  studentId: string;
  name: string;
  room: string;
}

function toLocalDateValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Home leave in this schema IS an outing_request (isOvernight=true) --
// there is no separate "leave" table (see backend's own outing-request
// repository comment). Recording one here reuses the exact same real
// Movement Log write the Movement log page's own "Record an exit" uses,
// just pre-set to purpose=HOME_LEAVE and isOvernight=true, so it shows up
// in both registers consistently -- no second, parallel write path.
export function RecordLeaveForm({ students }: { students: StudentOption[] }) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [calledByName, setCalledByName] = useState("");
  const [calledByPhone, setCalledByPhone] = useState("");
  const [from, setFrom] = useState(() => toLocalDateValue(new Date()));
  const [to, setTo] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const { showFlash } = useFlash();

  const selected = students.find((s) => s.studentId === studentId);

  function reset() {
    setStudentId("");
    setPurpose("");
    setCalledByName("");
    setCalledByPhone("");
    setFrom(toLocalDateValue(new Date()));
    setTo("");
    setError(undefined);
  }

  function submit() {
    if (!studentId) return setError("Select a student.");
    if (!purpose.trim()) return setError("Enter the purpose of the leave.");
    if (!calledByName.trim() || !calledByPhone.trim()) return setError("Enter who called and their phone number.");
    if (!to) return setError("Enter a return date.");
    if (to <= from) return setError("Return date must be after the start date.");

    startTransition(async () => {
      setError(undefined);
      try {
        await recordLeaveAction({
          studentId,
          reason: purpose.trim(),
          calledByName: calledByName.trim(),
          calledByPhone: calledByPhone.trim(),
          outFrom: new Date(`${from}T09:00:00`).toISOString(),
          expectedReturn: new Date(`${to}T18:00:00`).toISOString(),
        });
        showFlash("Leave recorded.");
        reset();
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "That didn't work. Please try again.");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <PrimaryButton type="button" style={{ height: 36 }} onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "+ Record leave"}
        </PrimaryButton>
      </div>
      {open && (
        <Card style={{ padding: "18px 20px" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>New leave entry</h3>
          <p style={{ margin: "4px 0 16px", fontSize: 12.5, color: "var(--hw-text-muted)" }}>
            Every field here is entered by the warden on the parent&apos;s call.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 14 }}>
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
              <TextInput value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Sibling wedding at Kozhikode" />
            </FieldLabel>
            <FieldLabel>
              Parent call
              <TextInput value={calledByName} onChange={(e) => setCalledByName(e.target.value)} placeholder="Father · 99400 71230" />
            </FieldLabel>
            <FieldLabel>
              Parent phone
              <TextInput value={calledByPhone} onChange={(e) => setCalledByPhone(e.target.value)} placeholder="99400 71230" />
            </FieldLabel>
            <FieldLabel>
              From
              <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ height: 36 }} />
            </FieldLabel>
            <FieldLabel>
              To
              <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ height: 36 }} />
            </FieldLabel>
          </div>
          {error && (
            <p role="alert" style={{ margin: "14px 0 0", padding: "10px 14px", borderRadius: 9, background: "var(--hw-red-bg)", color: "var(--hw-red-text)", fontSize: 13, fontWeight: 600 }}>
              {error}
            </p>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <PrimaryButton type="button" onClick={submit} disabled={pending} style={{ height: 34, padding: "0 18px", fontSize: 13 }}>
              {pending ? "Saving…" : "Save record"}
            </PrimaryButton>
            <GhostButton type="button" onClick={() => setOpen(false)} disabled={pending} style={{ height: 34, fontSize: 13 }}>
              Cancel
            </GhostButton>
          </div>
        </Card>
      )}
    </div>
  );
}
