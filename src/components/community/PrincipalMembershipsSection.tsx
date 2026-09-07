// Principal's read-only mirror of MembershipsSection -- same roster, no
// add-member/record-consent/remove controls.

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

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "ACTIVE") return "success";
  if (status === "REMOVED") return "critical";
  return "pending";
}

export function PrincipalMembershipsSection({ memberships }: { memberships: MembershipRow[] }) {
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
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="text-[13.5px] font-semibold text-text">
                {m.studentFirstName} {m.studentLastName ?? ""}
                <span className="ml-2 text-xs font-normal text-text-muted">{m.roleInCommunity.toLowerCase()}</span>
              </p>
              <p className="text-xs text-text-muted">
                Joined {formatDate(m.joinedOn)}
                {m.status === "PENDING_CONSENT" && <span className="ml-2 font-semibold text-pending-text">Consent pending</span>}
                {m.status === "ACTIVE" && m.parentConsentAt && (
                  <span className="ml-2">· Consent recorded {formatDate(m.parentConsentAt)}</span>
                )}
              </p>
            </div>
            <StatusPill tone={statusTone(m.status)} label={m.status.replace(/_/g, " ")} />
          </li>
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
    </div>
  );
}
