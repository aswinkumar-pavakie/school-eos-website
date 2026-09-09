// Community -> Announcements (self-service) -- send a notice to your own
// community, and see the history of what you've sent. This is a real, live
// mobile capability (see school-eos-mobile's community/announcements/index.tsx
// and community-api.ts) that had no website equivalent until now -- the
// website's own community/layout.tsx nav only went as far as Dashboard /
// Profile / Communities / Proposals / Activities. Adds this page to close
// that gap, using the exact same real endpoints Admin's own per-community
// detail page already calls (see actions.ts's own comment for the full
// authorization evidence).
//
// "The community I represent" is resolved the SAME way profile/page.tsx
// already does -- role_assignment.scope_id, read live via GET /auth/me,
// never a client-supplied id. GET /communities/:id/announcements already
// grants COMMUNITY read access (class-level @Roles on
// community-announcements.controller.ts).

import { BackLink } from "@/components/dashboard/BackLink";
import { MyAnnouncementsSection } from "@/components/community/MyAnnouncementsSection";
import { ErrorState } from "@/components/ui/EmptyState";
import { apiFetch } from "@/lib/api";

interface MeResponse {
  data: {
    roles: { role_code: string; scope_type: string; scope_id: string | null }[];
  };
}

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  state: string;
  publishedAt: string | null;
}

export default async function CommunityAnnouncementsPage() {
  const meRes = await apiFetch("/auth/me");
  if (!meRes.ok) {
    return <ErrorState message="Couldn't load your profile. Nothing was changed — try refreshing the page." />;
  }
  const { data: me } = (await meRes.json()) as MeResponse;
  const communityRole = me.roles.find((r) => r.role_code === "COMMUNITY" && r.scope_type === "COMMUNITY");

  if (!communityRole?.scope_id) {
    return (
      <div className="mx-auto max-w-[720px]">
        <BackLink href="/community" label="Dashboard" />
        <h1 className="mt-4 text-[28px] font-bold leading-[34px] text-text">Announcements</h1>
        <div className="mt-6">
          <ErrorState message="This Community account is not assigned to a specific community. Contact your Admin." />
        </div>
      </div>
    );
  }

  const communityId = communityRole.scope_id;
  const announcementsRes = await apiFetch(`/communities/${communityId}/announcements`);

  if (!announcementsRes.ok) {
    return (
      <div className="mx-auto max-w-[720px]">
        <BackLink href="/community" label="Dashboard" />
        <h1 className="mt-4 text-[28px] font-bold leading-[34px] text-text">Announcements</h1>
        <div className="mt-6">
          <ErrorState message="Couldn't load your announcements. Nothing was changed — try refreshing the page." />
        </div>
      </div>
    );
  }

  const { data: announcements } = (await announcementsRes.json()) as { data: AnnouncementRow[] };

  return (
    <div className="mx-auto max-w-[720px]">
      <BackLink href="/community" label="Dashboard" />
      <h1 className="mt-4 text-[28px] font-bold leading-[34px] text-text">Announcements</h1>
      <p className="mt-1 text-sm text-text-muted">Send notices to your community.</p>
      <div className="mt-6">
        <MyAnnouncementsSection communityId={communityId} announcements={announcements} />
      </div>
    </div>
  );
}
