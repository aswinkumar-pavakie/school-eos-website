// Principal -> Communities -> detail: read-only mirror of Admin's own
// community detail page (basic info, membership roster, activities,
// announcements). No EditCommunityForm, no add-member/record-consent/remove,
// no create-activity, no create/publish/archive-announcement controls --
// those stay Admin operational actions.

import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { PrincipalMembershipsSection } from "@/components/community/PrincipalMembershipsSection";
import { PrincipalActivitiesSection } from "@/components/community/PrincipalActivitiesSection";
import { PrincipalAnnouncementsSection } from "@/components/community/PrincipalAnnouncementsSection";
import { apiFetch } from "@/lib/api";

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

function stateTone(state: string): "success" | "pending" | "critical" {
  if (state === "ACTIVE") return "success";
  if (state === "SUSPENDED" || state === "ARCHIVED") return "critical";
  return "pending";
}

export default async function PrincipalCommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [communityRes, membershipsRes, activitiesRes, announcementsRes] = await Promise.all([
    apiFetch(`/communities/${id}`),
    apiFetch(`/communities/${id}/memberships`),
    apiFetch(`/communities/${id}/activities`),
    apiFetch(`/communities/${id}/announcements`),
  ]);

  if (communityRes.status === 404) notFound();
  if (!communityRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this community</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: community } = (await communityRes.json()) as { data: CommunityDetail };
  const memberships = membershipsRes.ok ? (await membershipsRes.json()).data : [];
  const activities = activitiesRes.ok ? (await activitiesRes.json()).data : [];
  const announcements = announcementsRes.ok ? (await announcementsRes.json()).data : [];

  return (
    <div className="mx-auto max-w-[960px]">
      <BackLink href="/principal/community" label="Communities" />

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

      <div className="mt-6 flex flex-col gap-6">
        <PrincipalMembershipsSection memberships={memberships} />
        <PrincipalActivitiesSection activities={activities} />
        <PrincipalAnnouncementsSection announcements={announcements} />
      </div>
    </div>
  );
}
