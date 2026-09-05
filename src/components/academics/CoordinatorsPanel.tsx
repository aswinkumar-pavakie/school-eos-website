"use client";

// Academic Coordinator / Sports Faculty assignments -- unlike a Class Advisor,
// one person can cover several standards (or a whole stage) at once, so this is a
// flat list (staff + role + what they cover) rather than a one-row-per-section
// table. Real pre-existing data (7 Academic Coordinators) is scoped by STAGE, not
// by individual standard -- this screen supports both, checkbox-driven rather
// than a native multi-select (which needs ctrl+click and shows a confusing
// "please select an item" validation message with no visual affordance for it).

import { useActionState, useState } from "react";
import {
  assignCoordinatorAction,
  endStaffRoleAssignmentAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/academics/actions";
import { StaffPersonPicker } from "./StaffPersonPicker";

const initialState: FormActionState = {};

// Real role_code values (role.code has a hard FK from role_assignment) -- these
// are the "extra responsibility" roles that make sense scoped to a stage/standard.
// COMMUNITY_INCHARGE/HOSTEL_WARDEN/HEALTH_INCHARGE are real roles too but scope to
// a community/hostel/infirmary, not academics, so they're out of scope here.
const ROLE_LABELS: Record<string, string> = {
  ACADEMIC_COORDINATOR: "Academic Coordinator",
  SPORTS_FACULTY: "Sports Faculty",
};

const STAGES: [string, string][] = [
  ["PRE_PRIMARY", "Pre-primary"],
  ["PRIMARY", "Primary"],
  ["MIDDLE", "Middle"],
  ["SECONDARY", "Secondary"],
  ["HIGHER_SECONDARY", "Higher secondary"],
];
const STAGE_LABELS: Record<string, string> = Object.fromEntries(STAGES);

export interface Grade {
  id: string;
  name: string;
}
export interface CoordinatorAssignment {
  id: string;
  personId: string;
  personFirstName: string;
  personLastName: string | null;
  roleCode: string;
  scopeId: string | null;
  scopeStage: string | null;
  scopeName: string | null;
}

export function CoordinatorsPanel({
  grades,
  assignments,
  academicYearId,
}: {
  grades: Grade[];
  assignments: CoordinatorAssignment[];
  academicYearId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [gradeFilter, setGradeFilter] = useState("");

  const filtered = gradeFilter
    ? assignments.filter((a) => a.scopeId === gradeFilter)
    : assignments;

  // Group by staff + role so "Academic Coordinator: R. Subha" shows everything
  // she covers as one row, not one row per standard/stage.
  const grouped = new Map<string, { staffName: string; roleLabel: string; coverage: string[]; ids: string[] }>();
  for (const a of filtered) {
    const key = `${a.personId}-${a.roleCode}`;
    const entry = grouped.get(key) ?? {
      staffName: `${a.personFirstName} ${a.personLastName ?? ""}`,
      roleLabel: ROLE_LABELS[a.roleCode] ?? a.roleCode,
      coverage: [],
      ids: [],
    };
    const label = a.scopeName ?? (a.scopeStage ? STAGE_LABELS[a.scopeStage] ?? a.scopeStage : null) ?? "Whole school";
    entry.coverage.push(label);
    entry.ids.push(a.id);
    grouped.set(key, entry);
  }

  if (!academicYearId) {
    return <p className="text-sm text-text-muted">Set a current academic year first (Academic years tab).</p>;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-text-muted">
          One person can cover several standards, or a whole stage — assign below.
        </p>
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-[13px] font-bold text-primary">
          {open ? "Cancel" : "+ Assign role"}
        </button>
      </div>

      <label className="mb-3 flex items-center gap-2 text-sm">
        <span className="font-semibold text-text">Filter by standard</span>
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="rounded-[11px] border border-border bg-field px-3 py-2 text-sm text-text outline-none focus:border-primary"
        >
          <option value="">All</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>

      {open && <AssignCoordinatorForm grades={grades} academicYearId={academicYearId} onDone={() => setOpen(false)} />}

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {grouped.size === 0 && <li className="py-3 text-sm text-text-muted">No coordinator/sports-faculty roles assigned yet.</li>}
        {[...grouped.entries()].map(([key, entry]) => (
          <li key={key} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-[13.5px] font-semibold text-text">{entry.staffName}</p>
              <p className="text-xs text-text-muted">
                {entry.roleLabel} · {entry.coverage.join(", ")}
              </p>
            </div>
            <div className="flex gap-3">
              {entry.ids.map((id) => (
                <EndButton key={id} id={id} />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EndButton({ id }: { id: string }) {
  const [isPending, setIsPending] = useState(false);
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={async () => {
        setIsPending(true);
        await endStaffRoleAssignmentAction(id);
      }}
      className="text-xs font-semibold text-critical-text disabled:opacity-60"
    >
      {isPending ? "…" : "End"}
    </button>
  );
}

function AssignCoordinatorForm({
  grades,
  academicYearId,
  onDone,
}: {
  grades: Grade[];
  academicYearId: string;
  onDone: () => void;
}) {
  const [scopeKind, setScopeKind] = useState<"STAGE" | "GRADE">("STAGE");
  const action = assignCoordinatorAction.bind(null, academicYearId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={(formData) => {
        formAction(formData);
        onDone();
      }}
      className="flex flex-col gap-3 rounded-[11px] bg-field p-3.5"
    >
      {state.error && (
        <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
      )}
      <StaffPersonPicker disabled={isPending} />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-semibold text-text">Role *</span>
        <select
          name="roleCode"
          required
          disabled={isPending}
          defaultValue="ACADEMIC_COORDINATOR"
          className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
        >
          <option value="ACADEMIC_COORDINATOR">Academic Coordinator</option>
          <option value="SPORTS_FACULTY">Sports Faculty</option>
        </select>
      </label>

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="scopeKind"
            checked={scopeKind === "STAGE"}
            onChange={() => setScopeKind("STAGE")}
            disabled={isPending}
          />
          By stage
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="scopeKind"
            checked={scopeKind === "GRADE"}
            onChange={() => setScopeKind("GRADE")}
            disabled={isPending}
          />
          By standard
        </label>
      </div>

      {scopeKind === "STAGE" ? (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-semibold text-text">Stages covered * (select one or more)</legend>
          <div className="grid grid-cols-2 gap-1.5">
            {STAGES.map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm text-text">
                <input type="checkbox" name="scopeStages" value={value} disabled={isPending} className="h-4 w-4 rounded border-border" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-semibold text-text">Standards covered * (select one or more)</legend>
          <div className="grid max-h-48 grid-cols-2 gap-1.5 overflow-y-auto">
            {grades.map((g) => (
              <label key={g.id} className="flex items-center gap-2 text-sm text-text">
                <input type="checkbox" name="gradeIds" value={g.id} disabled={isPending} className="h-4 w-4 rounded border-border" />
                {g.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Assign"}
      </button>
    </form>
  );
}
