// Club detail -- pixel-matched to the reference's own isCommunityDetail
// screen (back link, header with category/name/description/advisor/capacity
// + "+ New post", Members panel, Positions & office bearers panel, Posts to
// parents panel). No edit-club form here -- the reference design doesn't
// have one on this screen at all (only "+ Create club" on the list screen),
// so none is added here either.

import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { CommunityDetailBody } from "@/components/community/CommunityDetailBody";
import { apiFetch } from "@/lib/api";

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [communityRes, membershipsRes, positionsRes, announcementsRes] = await Promise.all([
    apiFetch(`/communities/${id}`),
    apiFetch(`/communities/${id}/memberships`),
    apiFetch(`/communities/${id}/positions`),
    apiFetch(`/communities/${id}/announcements`),
  ]);

  if (communityRes.status === 404) notFound();
  if (!communityRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this club</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: community } = await communityRes.json();
  const memberships = membershipsRes.ok ? (await membershipsRes.json()).data : [];
  const positions = positionsRes.ok ? (await positionsRes.json()).data : [];
  const announcements = announcementsRes.ok ? (await announcementsRes.json()).data : [];

  let advisor = "Unassigned";
  if (community.inchargeStaffId) {
    const staffRes = await apiFetch(`/staff/${community.inchargeStaffId}`);
    if (staffRes.ok) {
      const { data: staff } = await staffRes.json();
      advisor = `${staff.firstName} ${staff.lastName ?? ""}`.trim();
    }
  }

  return (
    <div className="mx-auto max-w-[1080px]">
      <BackLink href="/admin/community" label="Community" />

      <div className="mt-3.5">
        <CommunityDetailBody
          communityId={id}
          category={community.communityCategory}
          name={community.name}
          description={community.description ?? ""}
          advisor={advisor}
          memberCap={community.maxMembers}
          memberships={memberships}
          positions={positions}
          announcements={announcements}
        />
      </div>
    </div>
  );
}
