"use client";

import { useActionState } from "react";
import { PrimaryButton } from "@/components/academic-coordinator-ui/primitives";
import type { EligibleFaculty, MissingAdvisorItem, UnassignedOfferingItem } from "@/lib/faculty-coordinator-api";
import { assignAdvisorAction, assignOfferingTeacherAction, type FormState } from "./actions";

const initialState: FormState = {};

export function OfferingApprovalRow({ item, faculty }: { item: UnassignedOfferingItem; faculty: EligibleFaculty[] }) {
  const [state, formAction, pending] = useActionState(assignOfferingTeacherAction, initialState);
  return (
    <form action={formAction} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 130px", gap: 12, alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--acc-divider-soft)" }}>
      <input type="hidden" name="subjectOfferingId" value={item.subjectOfferingId} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--acc-navy)" }}>{item.title}</div>
        <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)", marginTop: 2 }}>{item.detail}</div>
        {state.error && <div role="alert" style={{ fontSize: 12, fontWeight: 600, color: "var(--acc-red)", marginTop: 4 }}>{state.error}</div>}
      </div>
      <select name="teacherStaffId" required defaultValue="" style={{ border: "1px solid var(--acc-border)", borderRadius: 9, padding: "9px 11px", fontSize: 13.5 }}>
        <option value="" disabled>Pick a teacher</option>
        {faculty.map((f) => (
          <option key={f.staffId} value={f.staffId}>{f.name}</option>
        ))}
      </select>
      <PrimaryButton type="submit" disabled={pending} style={{ padding: "9px 14px", fontSize: 13 }}>
        {pending ? "Assigning…" : "Assign"}
      </PrimaryButton>
    </form>
  );
}

export function AdvisorApprovalRow({ item, faculty }: { item: MissingAdvisorItem; faculty: EligibleFaculty[] }) {
  const [state, formAction, pending] = useActionState(assignAdvisorAction, initialState);
  return (
    <form action={formAction} style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 130px", gap: 12, alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--acc-divider-soft)" }}>
      <input type="hidden" name="sectionId" value={item.sectionId} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--acc-navy)" }}>{item.title}</div>
        <div style={{ fontSize: 12.5, color: "var(--acc-tertiary)", marginTop: 2 }}>{item.detail}</div>
        {state.error && <div role="alert" style={{ fontSize: 12, fontWeight: 600, color: "var(--acc-red)", marginTop: 4 }}>{state.error}</div>}
      </div>
      <select name="personId" required defaultValue="" style={{ border: "1px solid var(--acc-border)", borderRadius: 9, padding: "9px 11px", fontSize: 13.5 }}>
        <option value="" disabled>Pick a teacher</option>
        {faculty.map((f) => (
          <option key={f.personId} value={f.personId}>{f.name}</option>
        ))}
      </select>
      <PrimaryButton type="submit" disabled={pending} style={{ padding: "9px 14px", fontSize: 13 }}>
        {pending ? "Assigning…" : "Assign"}
      </PrimaryButton>
    </form>
  );
}
