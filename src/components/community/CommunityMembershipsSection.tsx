"use client";

// Community's own write-capable roster view -- distinct from
// PrincipalMembershipsSection (that one stays pure-display, reused unmodified
// by Principal's and Admin's own detail pages; this one is Community-profile-
// only). "Write" here means SUBMIT A REQUEST, not a direct change -- both
// actions route through the existing generic approvals engine to Principal
// (COMMUNITY_MEMBERSHIP_ADD / COMMUNITY_MEMBERSHIP_REMOVE), matching every
// other Community write in this app. No direct add/remove exists here.

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  requestAddMembershipAction,
  requestRemoveMembershipAction,
  type FormActionState,
} from "@/app/(dashboard)/community/profile/actions";
import { CommunityStudentPicker } from "@/components/community/CommunityStudentPicker";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { formatDate } from "@/lib/format";

interface StudentHit {
  id: string;
  firstName: string;
  lastName: string | null;
  admissionNo: string;
}

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

export function CommunityMembershipsSection({
  memberships,
  maxMembers,
}: {
  memberships: MembershipRow[];
  maxMembers: number | null;
}) {
  // ACTIVE + PENDING_CONSENT both occupy a seat (REMOVED frees it back up) --
  // matches the backend's own assertUnderCapacity exactly (both count the
  // same two statuses), so this can never disagree with what the server will
  // actually enforce.
  const visible = memberships.filter((m) => m.status !== "REMOVED");
  const removed = memberships.filter((m) => m.status === "REMOVED");
  const atCapacity = maxMembers !== null && visible.length >= maxMembers;
  const [adding, setAdding] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentHit | null>(null);
  const [state, formAction, isPending] = useActionState(requestAddMembershipAction, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && !state.error) {
      setAdding(false);
      setSelectedStudent(null);
    }
    wasPending.current = isPending;
  }, [isPending, state.error]);

  return (
    <div className="rounded-[16px] border border-border bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Membership roster</h2>
        <span className="text-xs text-text-muted">
          {visible.length}
          {maxMembers !== null ? ` / ${maxMembers}` : ""} members
        </span>
      </div>
      <p className="mt-1 text-xs text-text-muted">
        &ldquo;Request removal&rdquo; sends a request to your Principal — see its status below in Membership requests.
      </p>

      {visible.length === 0 && (
        <p className="mt-3 rounded-[11px] border border-dashed border-border bg-field px-3.5 py-3 text-sm text-text-muted">
          No members yet.
        </p>
      )}

      <ul className="mt-3 flex flex-col divide-y divide-border">
        {visible.map((m) => (
          <MembershipRowItem key={m.id} membership={m} />
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

      {atCapacity && !adding && (
        <p className="mt-3 rounded-[11px] border border-dashed border-border bg-field px-3.5 py-3 text-sm text-text-muted">
          This community has reached its maximum of {maxMembers} members. Request a removal to free up a seat before
          adding another.
        </p>
      )}

      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={atCapacity}
          className="mt-3 text-[13px] font-semibold text-primary disabled:cursor-not-allowed disabled:text-text-muted"
        >
          + Request new member
        </button>
      ) : (
        <form action={formAction} className="mt-4 flex flex-col gap-3 rounded-[11px] bg-field p-3.5">
          {state.error && (
            <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
          )}
          <input type="hidden" name="studentId" value={selectedStudent?.id ?? ""} required />
          <CommunityStudentPicker disabled={isPending} onSelect={setSelectedStudent} />
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
          <p className="text-xs text-text-muted">Sent to your Principal for review before the student is added.</p>
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
              {isPending ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function MembershipRowItem({ membership }: { membership: MembershipRow }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [requested, setRequested] = useState(false);

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div>
        <p className="text-[13.5px] font-semibold text-text">
          {membership.studentFirstName} {membership.studentLastName ?? ""}
          <span className="ml-2 text-xs font-normal text-text-muted">{membership.roleInCommunity.toLowerCase()}</span>
        </p>
        <p className="text-xs text-text-muted">
          Joined {formatDate(membership.joinedOn)}
          {membership.status === "PENDING_CONSENT" && (
            <span className="ml-2 font-semibold text-pending-text">Consent pending</span>
          )}
          {membership.status === "ACTIVE" && membership.parentConsentAt && (
            <span className="ml-2">· Consent recorded {formatDate(membership.parentConsentAt)}</span>
          )}
        </p>
        {error && <p className="mt-1 text-xs text-critical-text">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <StatusPill tone={statusTone(membership.status)} label={membership.status.replace(/_/g, " ")} />
        {requested ? (
          <span className="text-[13px] font-semibold text-text-muted">Removal requested</span>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await requestRemoveMembershipAction(membership.id);
                if (result.error) setError(result.error);
                else setRequested(true);
              })
            }
            className="text-[13px] font-semibold text-critical-text disabled:opacity-60"
          >
            Request removal
          </button>
        )}
      </div>
    </li>
  );
}
