import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { ActivitiesSection } from "@/components/community/ActivitiesSection";
import { AnnouncementsSection } from "@/components/community/AnnouncementsSection";
import { EditCommunityForm } from "@/components/community/EditCommunityForm";
import { MembershipsSection } from "@/components/community/MembershipsSection";
import { apiFetch } from "@/lib/api";

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: community } = await communityRes.json();
  const memberships = membershipsRes.ok ? (await membershipsRes.json()).data : [];
  const activities = activitiesRes.ok ? (await activitiesRes.json()).data : [];
  const announcements = announcementsRes.ok ? (await announcementsRes.json()).data : [];

  return (
    <div className="mx-auto max-w-[960px]">
      <BackLink href="/admin/community" label="Communities" />

      <h1 className="text-[28px] font-bold leading-[34px] text-text">{community.name}</h1>
      <p className="mt-1 text-sm text-text-muted">{community.communityCategory}</p>

      <div className="mt-6 flex flex-col gap-6">
        <EditCommunityForm community={community} />
        <MembershipsSection communityId={id} memberships={memberships} />
        <ActivitiesSection communityId={id} activities={activities} />
        <AnnouncementsSection communityId={id} announcements={announcements} />
      </div>
    </div>
  );
}
