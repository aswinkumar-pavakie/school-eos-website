// Community -> Profile (Phase 12). "The Community they represent" -- resolved
// from the SAME identity every other Community module already uses
// (role_assignment.scope_type='COMMUNITY', read live via GET /auth/me, never
// a client-supplied id), then rendered with the exact community/membership
// data Phase 4 already exposes. No new backend code: /auth/me, GET
// /communities/:id and GET /communities/:id/memberships all already exist and
// are already COMMUNITY-readable -- this page just resolves "which id" itself
// instead of trusting a URL param the way Phase 4's oversight-view detail page
// legitimately does (that page intentionally shows ANY community, mirroring
// Principal's oversight access -- this one shows only the caller's own).
//
// The roster itself renders via CommunityMembershipsSection (write-capable:
// request add/remove, routed through the existing generic approvals engine to
// Principal) rather than the read-only PrincipalMembershipsSection -- that
// component stays untouched and unchanged for Principal's/Admin's own detail
// pages, which never reused this profile page to begin with.

import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { CommunityMembershipsSection } from "@/components/community/CommunityMembershipsSection";
import { ErrorState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface MeResponse {
  data: {
    roles: { role_code: string; scope_type: string; scope_id: string | null }[];
  };
}

interface CommunityDetail {
  id: string;
  name: string;
  communityCategory: string;
  description: string | null;
  maxMembers: number | null;
  discussionEnabled: boolean;
  moderationMode: string;
  state: string;
}

interface MembershipRequestRow {
  id: string;
  action: "ADD" | "REMOVE";
  studentFirstName: string | null;
  studentLastName: string | null;
  roleInCommunity: string | null;
  status: string;
  createdAt: string;
}

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "ACTIVE") return "success";
  if (state === "SUSPENDED" || state === "ARCHIVED") return "critical";
  return "pending";
}

function requestStatusTone(status: string): "success" | "pending" | "critical" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "critical";
  return "pending";
}

export default async function CommunityProfilePage() {
  const meRes = await apiFetch("/auth/me");
  if (!meRes.ok) {
    return <ErrorState message="Couldn't load your profile. Nothing was changed — try refreshing the page." />;
  }
  const { data: me } = (await meRes.json()) as MeResponse;
  const communityRole = me.roles.find((r) => r.role_code === "COMMUNITY" && r.scope_type === "COMMUNITY");

  if (!communityRole?.scope_id) {
    return (
      <div>
        <h1 className="text-[28px] font-bold leading-[34px] text-text">Profile</h1>
        <div className="mt-6">
          <ErrorState message="This Community account is not assigned to a specific community. Contact your Admin." />
        </div>
      </div>
    );
  }

  const communityId = communityRole.scope_id;
  const [communityRes, membershipsRes, membershipRequestsRes] = await Promise.all([
    apiFetch(`/communities/${communityId}`),
    apiFetch(`/communities/${communityId}/memberships`),
    apiFetch("/community-membership-requests"),
  ]);

  if (!communityRes.ok) {
    return (
      <div>
        <h1 className="text-[28px] font-bold leading-[34px] text-text">Profile</h1>
        <div className="mt-6">
          <ErrorState message="Couldn't load your community. Nothing was changed — try refreshing the page." />
        </div>
      </div>
    );
  }

  const { data: community } = (await communityRes.json()) as { data: CommunityDetail };
  const memberships = membershipsRes.ok ? (await membershipsRes.json()).data : [];
  const membershipRequests: MembershipRequestRow[] = membershipRequestsRes.ok
    ? ((await membershipRequestsRes.json()) as { data: MembershipRequestRow[] }).data
    : [];

  return (
    <div className="mx-auto max-w-[720px]">
      <BackLink href="/community" label="Dashboard" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">{community.name}</h1>
          <p className="mt-1 text-sm text-text-muted">{community.communityCategory}</p>
        </div>
        <StatusPill tone={stateTone(community.state)} label={community.state} />
      </div>

      <div className="mt-6 rounded-[16px] border border-border bg-surface p-6">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Basic info</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Description</dt>
            <dd className="mt-0.5 text-text">{community.description ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Max members</dt>
            <dd className="mt-0.5 text-text">{community.maxMembers ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Discussion</dt>
            <dd className="mt-0.5 text-text">{community.discussionEnabled ? "Enabled" : "Disabled"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Moderation</dt>
            <dd className="mt-0.5 text-text">{community.moderationMode.replace(/_/g, " ").toLowerCase()}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6">
        {membershipsRes.ok ? (
          <CommunityMembershipsSection memberships={memberships} maxMembers={community.maxMembers} />
        ) : (
          <ErrorState message="Couldn't load membership information. Nothing was changed — try refreshing the page." />
        )}
      </div>

      {membershipRequestsRes.ok && membershipRequests.length > 0 && (
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-6">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Membership requests</h2>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {membershipRequests.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="text-text">
                  <span className="font-semibold">{r.action === "ADD" ? "Add" : "Remove"}</span>{" "}
                  {r.studentFirstName ? `${r.studentFirstName} ${r.studentLastName ?? ""}` : "member"}
                  <span className="ml-2 text-xs text-text-muted">{formatDate(r.createdAt)}</span>
                </span>
                <StatusPill tone={requestStatusTone(r.status)} label={r.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
