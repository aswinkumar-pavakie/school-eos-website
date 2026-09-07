"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createMembershipAction,
  recordConsentAction,
  removeMembershipAction,
  type FormActionState,
} from "@/app/(dashboard)/admin/community/actions";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate } from "@/lib/format";

interface MembershipRow {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string | null;
  roleInCommunity: string;
  parentConsentAt: string | null;
  joinedOn: string;
  status: string;
}

const initialState: FormActionState = {};

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "REMOVED") return "critical";
  return "pending";
}

export function MembershipsSection({ communityId, memberships }: { communityId: string; memberships: MembershipRow[] }) {
  const [adding, setAdding] = useState(false);
  const action = createMembershipAction.bind(null, communityId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  const visible = memberships.filter((m) => m.status !== "REMOVED");
  const removed = memberships.filter((m) => m.status === "REMOVED");

  return (
    <div className="rounded-[16px] border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Membership roster</h2>
        <span className="text-xs text-text-muted">{visible.length} members</span>
      </div>

      {visible.length === 0 && (
        <p className="mt-3 rounded-[11px] border border-dashed border-border bg-field px-3.5 py-3 text-sm text-text-muted">
          No members yet.
        </p>
      )}

      <ul className="mt-3 flex flex-col divide-y divide-border">
        {visible.map((m) => (
          <MembershipRowItem key={m.id} communityId={communityId} membership={m} />
        ))}
      </ul>

      {removed.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[13px] font-semibold text-text-muted">{removed.length} removed</summary>
          <ul className="mt-2 flex flex-col divide-y divide-border opacity-60">
            {removed.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                <span>
                  {m.studentFirstName} {m.studentLastName ?? ""}
                </span>
                <StatusPill tone="critical" label="Removed" />
              </li>
            ))}
          </ul>
        </details>
      )}

      {!adding ? (
        <button type="button" onClick={() => setAdding(true)} className="mt-3 text-[13px] font-semibold text-primary">
          + Add member
        </button>
      ) : (
        <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
          {state.error && <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Student ID *</span>
            <input
              name="studentId"
              required
              disabled={isPending}
              placeholder="Existing student UUID"
              className="rounded-[11px] border border-border bg-surface px-3 py-2 font-mono text-[13px] text-text outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Role</span>
            <select
              name="roleInCommunity"
              disabled={isPending}
              defaultValue=""
              className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
            >
              <option value="">Member (default)</option>
              <option value="MEMBER">Member</option>
              <option value="LEAD">Lead</option>
            </select>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-bold text-text hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {isPending ? "Adding…" : "Add member"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function MembershipRowItem({ communityId, membership }: { communityId: string; membership: MembershipRow }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div>
        <p className="text-[13.5px] font-semibold text-text">
          {membership.studentFirstName} {membership.studentLastName ?? ""}
          <span className="ml-2 text-xs font-normal text-text-muted">{membership.roleInCommunity.toLowerCase()}</span>
        </p>
        <p className="text-xs text-text-muted">
          Joined {formatDate(membership.joinedOn)}
          {membership.status === "PENDING_CONSENT" && <span className="ml-2 font-semibold text-pending-text">Consent pending</span>}
          {membership.status === "ACTIVE" && membership.parentConsentAt && (
            <span className="ml-2">· Consent recorded {formatDate(membership.parentConsentAt)}</span>
          )}
        </p>
        {error && <p className="mt-1 text-xs text-critical-text">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <StatusPill tone={statusTone(membership.status)} label={membership.status.replace(/_/g, " ")} />
        {membership.status === "PENDING_CONSENT" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await recordConsentAction(communityId, membership.id);
                setError(result.error);
              })
            }
            className="text-[13px] font-semibold text-primary disabled:opacity-60"
          >
            Record consent
          </button>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await removeMembershipAction(communityId, membership.id);
              setError(result.error);
            })
          }
          className="text-[13px] font-semibold text-critical-text disabled:opacity-60"
        >
          Remove
        </button>
      </div>
    </li>
  );
}
