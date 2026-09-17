"use client";

import { useActionState, useState, useTransition } from "react";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { grantRoleAssignmentAction, revokeRoleAssignmentAction, type FormActionState } from "@/app/(dashboard)/admin/access-control/actions";
import { PersonPicker } from "./PersonPicker";
import { formatDate } from "@/lib/format";

export interface RoleRow {
  code: string;
  name: string;
  isCoreLogin: boolean;
  description: string | null;
  moduleAccess: string[];
}

export interface RoleAssignmentRow {
  id: string;
  personId: string;
  personFirstName: string;
  personLastName: string | null;
  roleCode: string;
  scopeType: string;
  scopeId: string | null;
  scopeStage: string | null;
  scopeName: string | null;
  gradeName: string | null;
  academicYearName: string | null;
  validFrom: string;
  validTo: string | null;
  status: string;
  createdAt: string;
}

const SCOPE_TYPES = ["SCHOOL", "CAMPUS", "STAGE", "GRADE", "SECTION", "SUBJECT_OFFERING", "COMMUNITY", "HOSTEL", "BUS", "TEAM", "TERMINAL", "VENDOR"];
const SCOPE_STAGES = ["PRE_PRIMARY", "PRIMARY", "MIDDLE", "SECONDARY", "HIGHER_SECONDARY"];

const initialState: FormActionState = {};

const TABS = ["Roles", "Assignments"] as const;
type Tab = (typeof TABS)[number];

export function AccessControlTabs({ roles, assignments }: { roles: RoleRow[]; assignments: RoleAssignmentRow[] }) {
  const [tab, setTab] = useState<Tab>("Roles");

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-semibold transition-colors ${
              tab === t ? "bg-primary text-white" : "bg-field text-text-muted hover:bg-border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-[16px] border border-border bg-surface p-[18px]">
        {tab === "Roles" && <RolesCatalog roles={roles} />}
        {tab === "Assignments" && <AssignmentsPanel assignments={assignments} roles={roles} />}
      </div>
    </div>
  );
}

function RolesCatalog({ roles }: { roles: RoleRow[] }) {
  return (
    <div>
      <p className="text-[13px] text-text-muted">
        {roles.length} roles — fixed by the product, not a configurable permission builder. Which modules each role unlocks:
      </p>
      <ul className="mt-4 flex flex-col divide-y divide-border">
        {roles.map((r) => (
          <li key={r.code} className="py-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <p className="text-[13.5px] font-semibold text-text">{r.name}</p>
              <span className="font-mono text-xs text-text-muted">{r.code}</span>
              {r.isCoreLogin && <StatusPill tone="success" label="Web/mobile login" />}
            </div>
            {r.description && <p className="mt-1 text-xs text-text-muted">{r.description}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {r.moduleAccess.length === 0 ? (
                <span className="text-xs text-text-muted">No module access mapped.</span>
              ) : (
                r.moduleAccess.map((m) => (
                  <span key={m} className="rounded-[7px] bg-field px-2 py-1 text-[11px] font-semibold text-text-muted">
                    {m}
                  </span>
                ))
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AssignmentsPanel({ assignments, roles }: { assignments: RoleAssignmentRow[]; roles: RoleRow[] }) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, isPending] = useActionState(grantRoleAssignmentAction, initialState);
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  const filtered = statusFilter ? assignments.filter((a) => a.status === statusFilter) : assignments;
  const grantableRoles = roles.filter((r) => r.code !== "ADMIN");

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{assignments.length} assignment(s)</p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[13px] font-semibold text-primary">
            + Grant role
          </button>
        )}
      </div>

      {adding && (
        <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
          <p className="text-[13px] font-bold text-text">Grant a role</p>
          {state.error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <PersonPicker disabled={isPending} />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Role *</span>
              <select
                name="roleCode"
                required
                disabled={isPending}
                defaultValue=""
                className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text outline-none focus:border-primary"
              >
                <option value="" disabled>
                  Select
                </option>
                {grantableRoles.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Scope type *</span>
              <select
                name="scopeType"
                required
                disabled={isPending}
                defaultValue="SCHOOL"
                className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text outline-none focus:border-primary"
              >
                {SCOPE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Scope ID (optional)</span>
              <input
                name="scopeId"
                disabled={isPending}
                placeholder="e.g. the grade/section/community id"
                className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-semibold text-text">Scope stage (optional)</span>
              <select
                name="scopeStage"
                disabled={isPending}
                defaultValue=""
                className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-text outline-none focus:border-primary"
              >
                <option value="">None</option>
                {SCOPE_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface"
            >
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60">
              {isPending ? "Granting…" : "Grant role"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 flex items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-semibold text-text">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="REVOKED">Revoked</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </label>
      </div>

      <ul className="mt-4 flex flex-col divide-y divide-border">
        {filtered.length === 0 && <li className="py-6 text-center text-sm text-text-muted">No assignments match this filter.</li>}
        {filtered.map((a) => (
          <AssignmentRow key={a.id} assignment={a} />
        ))}
      </ul>
    </div>
  );
}

function AssignmentRow({ assignment }: { assignment: RoleAssignmentRow }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function handleRevoke() {
    setError(null);
    startTransition(async () => {
      const result = await revokeRoleAssignmentAction(assignment.id);
      if (result.error) setError(result.error);
      else setConfirming(false);
    });
  }

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-semibold text-text">
            {assignment.personFirstName} {assignment.personLastName ?? ""}
            <span className="ml-2 font-mono text-xs font-normal text-text-muted">{assignment.roleCode}</span>
          </p>
          <p className="text-xs text-text-muted">
            {assignment.scopeType.replace(/_/g, " ")}
            {assignment.scopeName ? ` · ${assignment.scopeName}` : ""}
            {assignment.gradeName && assignment.gradeName !== assignment.scopeName ? ` · ${assignment.gradeName}` : ""}
            {assignment.academicYearName ? ` · ${assignment.academicYearName}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            Since {formatDate(assignment.validFrom)}
            {assignment.validTo ? ` · until ${formatDate(assignment.validTo)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusPill tone={assignment.status === "ACTIVE" ? "success" : assignment.status === "REVOKED" ? "critical" : "pending"} label={assignment.status} />
          {assignment.status === "ACTIVE" && !confirming && (
            <button type="button" onClick={() => setConfirming(true)} className="text-[13px] font-semibold text-critical-text">
              Revoke
            </button>
          )}
        </div>
      </div>
      {confirming && (
        <div className="mt-2.5 rounded-[11px] border border-critical-text bg-critical-bg p-3">
          {error && <p className="text-xs font-medium text-critical-text">{error}</p>}
          <p className="text-xs font-medium text-critical-text">Revoke this role assignment?</p>
          <div className="mt-2 flex justify-end gap-2.5">
            <button type="button" disabled={isPending} onClick={() => setConfirming(false)} className="text-[13px] font-semibold text-text-muted">
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleRevoke}
              className="rounded-[9px] bg-critical-text px-3 py-1.5 text-[13px] font-bold text-white disabled:opacity-40"
            >
              {isPending ? "Revoking…" : "Confirm revoke"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
