"use client";

import { useActionState, useEffect, useState } from "react";
import { FieldLabel, PrimaryButton, SecondaryButton, Select, TextArea, TextInput } from "@/components/sports-ui/primitives";
import { SignaturePad } from "@/components/sports-ui/SignaturePad";
import type { EquipmentItem, SportsTeam, StudentSummary } from "@/lib/sports-admin-api";
import { listMyTeams, listStudents } from "@/lib/sports-admin-api";
import { issueEquipmentAction, type FormState } from "./actions";

const initial: FormState = {};

export function IssueEquipmentPanel({ item }: { item: EquipmentItem }) {
  const [open, setOpen] = useState(false);
  const action = issueEquipmentAction.bind(null, item.id);
  const [state, formAction] = useActionState(action, initial);
  const [target, setTarget] = useState<"student" | "team">("student");
  const [teams, setTeams] = useState<SportsTeam[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentSummary[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);

  useEffect(() => {
    if (!open) return;
    listMyTeams().then(setTeams).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (target !== "student" || query.trim().length < 2) { setResults([]); return; }
    const handle = setTimeout(() => {
      listStudents({ search: query.trim() }).then((r) => setResults(r.data.slice(0, 8))).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, target]);

  if (item.quantityAvailable <= 0) {
    return <span style={{ fontSize: 12.5, color: "var(--sport-tertiary)" }}>None available</span>;
  }

  if (!open) {
    return <SecondaryButton type="button" onClick={() => setOpen(true)}>Issue</SecondaryButton>;
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(16,35,59,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setOpen(false)}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", border: "1px solid var(--sport-border)", borderRadius: "var(--sport-radius-card)", padding: "22px 24px", width: 440, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sport-heading)" }}>Issue {item.name}</div>
        <form action={formAction} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 16, fontSize: 13.5 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="radio" checked={target === "student"} onChange={() => setTarget("student")} /> To a student
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="radio" checked={target === "team"} onChange={() => setTarget("team")} /> To a squad
            </label>
          </div>

          {target === "student" ? (
            <div style={{ position: "relative" }}>
              <FieldLabel>Student</FieldLabel>
              <input type="hidden" name="issuedToStudentId" value={selectedStudent?.id ?? ""} />
              <TextInput
                value={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName ?? ""} · ${selectedStudent.admissionNo}` : query}
                onChange={(e) => { setSelectedStudent(null); setQuery(e.target.value); }}
                placeholder="Search by name or admission no."
              />
              {!selectedStudent && results.length > 0 && (
                <div style={{ position: "absolute", zIndex: 5, top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--sport-border)", borderRadius: 10, marginTop: 4, boxShadow: "0 8px 24px rgba(16,35,59,0.12)" }}>
                  {results.map((s) => (
                    <div key={s.id} onClick={() => { setSelectedStudent(s); setResults([]); }} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13.5, borderBottom: "1px solid var(--sport-divider)" }}>
                      {s.firstName} {s.lastName ?? ""} <span style={{ color: "var(--sport-tertiary)" }}>· {s.admissionNo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <FieldLabel>Squad</FieldLabel>
              <Select name="issuedToTeamId" required defaultValue="">
                <option value="" disabled>Select a squad</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><FieldLabel>Quantity</FieldLabel><TextInput name="quantity" type="number" min={1} max={item.quantityAvailable} required defaultValue={1} /></div>
            <div><FieldLabel>Due on</FieldLabel><TextInput name="dueOn" type="date" /></div>
          </div>
          <div><FieldLabel>Reason</FieldLabel><TextArea name="reason" required rows={2} placeholder="e.g. Training session" /></div>
          <SignaturePad name="signaturePngBase64" />
          {state.error && <div style={{ padding: "10px 14px", borderRadius: 9, background: "var(--sport-red-bg)", color: "var(--sport-red)", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <SecondaryButton type="button" onClick={() => setOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit" disabled={target === "student" && !selectedStudent}>Issue</PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
