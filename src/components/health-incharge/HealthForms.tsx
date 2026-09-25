"use client";

// The Health In-charge write forms (each opens in the shared Modal, submits a server action,
// and shows the backend's own message on success or failure).

import { useActionState, useState, useTransition } from "react";
import {
  acknowledgeAlertAction,
  logEscalationAction,
  notifyParentAction,
  recordVisitAction,
  saveProfileAction,
  updateVisitAction,
  type HealthFormState,
} from "@/app/(dashboard)/health-incharge/actions";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import {
  ACTION_LABEL,
  BLOOD_GROUPS,
  CHANNELS,
  SERIOUS_ACTIONS,
  VISIT_ACTIONS,
  studentName,
  type HealthProfile,
  type StudentLookup,
  type VisitRow,
} from "@/lib/health-incharge-shared";
import { HealthStudentPicker } from "./HealthStudentPicker";

const initial: HealthFormState = {};

function Feedback({ state }: { state: HealthFormState }) {
  if (state.error) return <p role="alert" className="rounded-[var(--radius-input)] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>;
  if (state.ok) return <p role="status" className="rounded-[var(--radius-input)] bg-success-bg px-3 py-2 text-sm text-success-text">{state.ok}</p>;
  return null;
}

function ActionSelect({ defaultValue = "REST", onChange }: { defaultValue?: string; onChange?: (v: string) => void }) {
  return (
    <SelectField label="Action taken" name="action" defaultValue={defaultValue} onChange={(e) => onChange?.(e.target.value)}>
      {VISIT_ACTIONS.map((a) => (
        <option key={a} value={a}>
          {ACTION_LABEL[a]}
        </option>
      ))}
    </SelectField>
  );
}

/** Record a new infirmary visit. `student` fixes the student (used on the student page). */
export function RecordVisitModal({ student, label = "+ Record visit" }: { student?: Pick<StudentLookup, "studentId" | "firstName" | "lastName">; label?: string }) {
  const [state, action] = useActionState(recordVisitAction, initial);
  const [act, setAct] = useState("REST");
  const serious = SERIOUS_ACTIONS.includes(act);
  return (
    <Modal title="Record infirmary visit" trigger={<PlainButton variant="primary">{label}</PlainButton>}>
      <form action={action} className="flex max-h-[70vh] flex-col gap-3.5 overflow-y-auto pr-1">
        {student ? (
          <>
            <input type="hidden" name="studentId" value={student.studentId} />
            <p className="text-sm text-text">
              Student: <strong>{studentName(student)}</strong>
            </p>
          </>
        ) : (
          <HealthStudentPicker />
        )}
        <TextField label="Complaint" name="complaint" required maxLength={300} placeholder="e.g. Headache, stomach pain" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Temp (°C)" name="temp_c" type="number" step="0.1" min={34} max={43} />
          <TextField label="Pulse (bpm)" name="pulse" type="number" min={20} max={250} />
          <TextField label="SpO₂ (%)" name="spo2" type="number" min={50} max={100} />
          <TextField label="BP (e.g. 110/70)" name="bp" pattern="\d{2,3}/\d{2,3}" title="Like 110/70" />
        </div>
        <TextAreaField label="Observation" name="observation" maxLength={1000} rows={2} />
        <ActionSelect onChange={setAct} />
        <TextField label="Outcome" name="outcome" maxLength={500} placeholder="e.g. Recovered after rest; resumed classes" />
        {serious ? (
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" name="notifyParent" value="no" className="h-4 w-4" />
            Do <strong>not</strong> notify the guardians yet
          </label>
        ) : null}
        <p className="text-[13px] text-text-muted">
          {serious ? "The student's guardians are notified immediately." : "Guardians are not notified for this action (you can notify them later)."}
        </p>
        <Feedback state={state} />
        <Button type="submit" pendingLabel="Saving…">
          Save visit
        </Button>
      </form>
    </Modal>
  );
}

export function UpdateVisitModal({ visit }: { visit: VisitRow }) {
  const [state, action] = useActionState(updateVisitAction.bind(null, visit.id), initial);
  return (
    <Modal title="Update visit" trigger={<button type="button" className="text-[13px] font-semibold text-primary">Update</button>}>
      <form action={action} className="flex flex-col gap-3.5">
        <p className="text-sm text-text-muted">
          {studentName({ studentFirstName: visit.studentFirstName, studentLastName: visit.studentLastName })} — {visit.complaint}
        </p>
        <TextAreaField label="Observation" name="observation" defaultValue={visit.observation ?? ""} rows={2} maxLength={1000} />
        <ActionSelect defaultValue={visit.action} />
        <TextField label="Outcome" name="outcome" defaultValue={visit.outcome ?? ""} maxLength={500} />
        <Feedback state={state} />
        <Button type="submit" pendingLabel="Saving…">Save changes</Button>
      </form>
    </Modal>
  );
}

export function LogContactModal({ visit }: { visit: VisitRow }) {
  const [state, action] = useActionState(logEscalationAction.bind(null, visit.id), initial);
  return (
    <Modal title="Log a contact" trigger={<button type="button" className="text-[13px] font-semibold text-primary">Log contact</button>}>
      <form action={action} className="flex flex-col gap-3.5">
        <p className="text-sm text-text-muted">
          Who did you reach about {studentName({ studentFirstName: visit.studentFirstName, studentLastName: visit.studentLastName })}&apos;s visit?
        </p>
        <TextField label="Person contacted" name="contactedName" required maxLength={120} />
        <SelectField label="Channel" name="channel" defaultValue="PHONE">
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c.replace("_", " ").toLowerCase()}
            </option>
          ))}
        </SelectField>
        <TextField label="Their response" name="response" maxLength={500} />
        <TextField label="Outcome" name="outcome" maxLength={500} />
        <Feedback state={state} />
        <Button type="submit" pendingLabel="Saving…">Log contact</Button>
      </form>
    </Modal>
  );
}

/** One-click actions that need no form (notify guardians / acknowledge alert). */
export function OneClickButton({ label, doneLabel, run }: { label: string; doneLabel: string; run: () => Promise<HealthFormState> }) {
  const [state, setState] = useState<HealthFormState>({});
  const [pending, start] = useTransition();
  if (state.ok) return <span className="text-[13px] font-semibold text-success-text">{doneLabel}</span>;
  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setState(await run()))}
        className="text-[13px] font-semibold text-primary disabled:opacity-50"
      >
        {pending ? "Working…" : label}
      </button>
      {state.error && <span role="alert" className="text-[12px] text-critical-text">{state.error}</span>}
    </span>
  );
}

export const NotifyParentButton = ({ visitId }: { visitId: string }) => (
  <OneClickButton label="Notify guardians" doneLabel="Guardians notified" run={() => notifyParentAction(visitId)} />
);
export const AcknowledgeAlertButton = ({ alertId }: { alertId: string }) => (
  <OneClickButton label="Acknowledge" doneLabel="Acknowledged" run={() => acknowledgeAlertAction(alertId)} />
);

export function HealthProfileForm({ studentId, profile }: { studentId: string; profile: HealthProfile | null }) {
  const [state, action] = useActionState(saveProfileAction.bind(null, studentId), initial);
  return (
    <form action={action} className="grid gap-3.5 sm:grid-cols-2">
      <SelectField label="Blood group" name="bloodGroup" defaultValue={profile?.bloodGroup ?? ""}>
        <option value="">Not recorded</option>
        {BLOOD_GROUPS.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </SelectField>
      <TextField label="Measured on" name="measuredOn" type="date" defaultValue={profile?.measuredOn?.slice(0, 10) ?? ""} />
      <TextField label="Height (cm)" name="heightCm" type="number" step="0.1" min={30} max={250} defaultValue={profile?.heightCm ?? ""} />
      <TextField label="Weight (kg)" name="weightKg" type="number" step="0.1" min={2} max={250} defaultValue={profile?.weightKg ?? ""} />
      <TextField label="Family doctor" name="familyDoctor" maxLength={120} defaultValue={profile?.familyDoctor ?? ""} />
      <TextField label="Doctor phone" name="doctorPhone" maxLength={20} defaultValue={profile?.doctorPhone ?? ""} />
      <TextField label="Insurance reference" name="insuranceRef" maxLength={80} defaultValue={profile?.insuranceRef ?? ""} />
      <div className="sm:col-span-2">
        <TextAreaField label="Notes" name="notes" maxLength={1000} rows={3} defaultValue={profile?.notes ?? ""} />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Feedback state={state} />
        <div>
          <Button type="submit" pendingLabel="Saving…">Save health profile</Button>
        </div>
      </div>
    </form>
  );
}
