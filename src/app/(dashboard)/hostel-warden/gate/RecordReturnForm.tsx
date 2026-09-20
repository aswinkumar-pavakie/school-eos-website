"use client";

import { useState, useTransition } from "react";
import { Card, FieldLabel, GhostButton, PrimaryButton, TextInput } from "@/components/hostel-warden-ui/primitives";
import { useFlash } from "@/components/hostel-warden-ui/FlashContext";
import { formatDateTime } from "@/lib/format";
import { recordGateReturnAction } from "./actions";

interface OutStudent {
  id: string;
  studentName: string;
  admissionNo: string;
  room: string;
  blockName: string;
  dueAt: string;
}

export function RecordReturnForm({ students, onDone }: { students: OutStudent[]; onDone: () => void }) {
  const [id, setId] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const { showFlash } = useFlash();

  const selected = students.find((s) => s.id === id);

  function submit() {
    if (!id) return setError("Select a student.");
    startTransition(async () => {
      setError(undefined);
      try {
        await recordGateReturnAction(id);
        showFlash("Return logged.");
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "That didn't work. Please try again.");
      }
    });
  }

  return (
    <Card style={{ padding: "18px 20px" }}>
      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>New expected return</h3>
      <p style={{ margin: "4px 0 16px", fontSize: 12.5, color: "var(--hw-text-muted)" }}>
        Every field here is entered by the warden — students and parents have no login.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 14 }}>
        <FieldLabel>
          Student name
          <select className="input" value={id} onChange={(e) => setId(e.target.value)} style={{ height: 36 }}>
            <option value="">Select a student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.studentName} · {s.admissionNo}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel>
          Admission no.
          <TextInput value={selected?.admissionNo ?? ""} readOnly placeholder="—" />
        </FieldLabel>
        <FieldLabel>
          Block
          <TextInput value={selected?.blockName ?? ""} readOnly placeholder="—" />
        </FieldLabel>
        <FieldLabel>
          Room
          <TextInput value={selected?.room ?? ""} readOnly placeholder="—" />
        </FieldLabel>
        <FieldLabel>
          Due time
          <TextInput value={selected ? formatDateTime(selected.dueAt) : ""} readOnly placeholder="—" />
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
        <GhostButton type="button" onClick={onDone} disabled={pending} style={{ height: 34, fontSize: 13 }}>
          Cancel
        </GhostButton>
      </div>
    </Card>
  );
}
