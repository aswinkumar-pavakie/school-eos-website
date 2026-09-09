"use client";

import { useActionState, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, PlainButton } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { EmptyState, FieldError } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { formatDate, formatTime } from "@/lib/format";
import type { SportsTeam, TeamRosterMember, TrainingAttendanceEntry, TrainingSession } from "@/lib/sports-faculty-api";
import { createSessionAction, recordAttendanceAction, updateSessionStatusAction, type FormState } from "./actions";

const initial: FormState = {};
const ATTENDANCE_OPTIONS: [string, string][] = [
  ["PRESENT", "Present"],
  ["ABSENT", "Absent"],
  ["LATE", "Late"],
];

export function TrainingPanel({
  teams,
  sessions,
  rostersByTeam,
  attendanceBySession,
}: {
  teams: SportsTeam[];
  sessions: TrainingSession[];
  rostersByTeam: Record<string, TeamRosterMember[]>;
  attendanceBySession: Record<string, TrainingAttendanceEntry[]>;
}) {
  const sorted = [...sessions].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CreateSessionModal teams={teams} />
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No training sessions yet" body="Schedule your first session for one of your teams." />
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              roster={rostersByTeam[session.teamId] ?? []}
              attendance={attendanceBySession[session.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateSessionModal({ teams }: { teams: SportsTeam[] }) {
  const [state, formAction] = useActionState(createSessionAction, initial);
  return (
    <Modal title="Schedule training session" trigger={<PlainButton variant="primary">+ Schedule session</PlainButton>}>
      <form action={formAction} className="flex flex-col gap-4">
        <SelectField label="Team" name="teamId" required defaultValue="">
          <option value="" disabled>Choose a team…</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.sportName})</option>
          ))}
        </SelectField>
        <TextField label="Date & time" name="scheduledAt" type="datetime-local" required />
        <TextField label="Venue" name="venue" placeholder="e.g. Ground A" />
        <TextField label="Focus" name="focus" placeholder="e.g. Passing drills" />
        <FieldError message={state.error} />
        <Button variant="primary" pendingLabel="Scheduling…">Schedule session</Button>
      </form>
    </Modal>
  );
}

function SessionCard({
  session,
  roster,
  attendance,
}: {
  session: TrainingSession;
  roster: TeamRosterMember[];
  attendance: TrainingAttendanceEntry[];
}) {
  const [expanded, setExpanded] = useState(false);
  const attendanceByStudent = new Map(attendance.map((a) => [a.studentId, a.status]));

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-text">{session.teamName}</p>
          <p className="mt-0.5 text-xs text-text-muted">
            {formatDate(session.scheduledAt)} · {formatTime(session.scheduledAt)}
            {session.venue ? ` · ${session.venue}` : ""}
            {session.focus ? ` · ${session.focus}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill state={session.status} />
          {session.status === "SCHEDULED" && (
            <>
              <MarkStatusButton sessionId={session.id} status="COMPLETED" label="Mark completed" />
              <MarkStatusButton sessionId={session.id} status="CANCELLED" label="Cancel" />
            </>
          )}
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs font-bold text-primary hover:underline">
            {expanded ? "Close" : "Attendance"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-border pt-4">
          {roster.length === 0 ? (
            <p className="text-sm text-text-muted">No active roster for this team yet.</p>
          ) : (
            <AttendanceForm sessionId={session.id} roster={roster} attendanceByStudent={attendanceByStudent} />
          )}
        </div>
      )}
    </div>
  );
}

function MarkStatusButton({ sessionId, status, label }: { sessionId: string; status: string; label: string }) {
  const action = updateSessionStatusAction.bind(null, sessionId, status);
  return (
    <form action={action}>
      <button type="submit" className="text-xs font-bold text-primary hover:underline">{label}</button>
    </form>
  );
}

function AttendanceForm({
  sessionId,
  roster,
  attendanceByStudent,
}: {
  sessionId: string;
  roster: TeamRosterMember[];
  attendanceByStudent: Map<string, string>;
}) {
  const studentIds = roster.map((m) => m.studentId);
  const action = recordAttendanceAction.bind(null, sessionId, studentIds);
  const [state, formAction] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-border">
        {roster.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <p className="text-sm font-semibold text-text">{m.studentFirstName} {m.studentLastName}</p>
            <div className="flex gap-1">
              {ATTENDANCE_OPTIONS.map(([value, label]) => (
                <label key={value} className="flex items-center gap-1 text-xs text-text">
                  <input
                    type="radio"
                    name={`status:${m.studentId}`}
                    value={value}
                    defaultChecked={(attendanceByStudent.get(m.studentId) ?? "PRESENT") === value}
                  />
                  {label}
                </label>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <FieldError message={state.error} />
      <div>
        <Button variant="primary" pendingLabel="Saving…">Save attendance</Button>
      </div>
    </form>
  );
}
