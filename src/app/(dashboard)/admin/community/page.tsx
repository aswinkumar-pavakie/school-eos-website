// Community -- rebuilt to pixel-match "SIS ADMIN with community/Admin
// Portal.dc.html"'s own isCommunityList screen (real school Clubs, not the
// old table-based Communities list). Same real /communities data as before,
// just the card-grid presentation the reference design uses -- category
// badge, member count, name, description, teacher in-charge, real posts-to-
// parents count. Search/category filtering happens client-side (small real
// dataset, same pattern the reference's own clubQuery/clubCategoryFilter use).

import { CreateCommunityModal } from "@/components/community/CreateCommunityModal";
import { apiFetch } from "@/lib/api";
import { CommunityListClient } from "@/components/community/CommunityListClient";

interface CommunityRow {
  id: string;
  name: string;
  communityCategory: string;
  description: string | null;
  inchargeStaffId: string | null;
  academicYearId: string;
  maxMembers: number | null;
  state: string;
}
interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}
interface StaffRow {
  id: string;
  firstName: string;
  lastName: string | null;
}
interface MembershipRow {
  id: string;
  status: string;
}
interface AnnouncementRow {
  id: string;
  state: string;
}

export default async function CommunityPage() {
  const [communitiesRes, yearsRes, staffRes] = await Promise.all([
    apiFetch("/communities"),
    apiFetch("/academic-years"),
    apiFetch("/staff?limit=500"),
  ]);

  if (!communitiesRes.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Community</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: communities }: { data: CommunityRow[] } = await communitiesRes.json();
  const years: AcademicYear[] = yearsRes.ok ? (await yearsRes.json()).data : [];
  const staff: StaffRow[] = staffRes.ok ? (await staffRes.json()).data : [];
  const staffById = new Map(staff.map((s) => [s.id, `${s.firstName} ${s.lastName ?? ""}`.trim()]));
  const currentYear = years.find((y) => y.isCurrent);

  // Real per-club member count + real posts-to-parents count (announcement
  // rows) -- small dataset (a handful of clubs), same N+1-is-fine pattern
  // this codebase already uses elsewhere for small tables.
  const clubs = await Promise.all(
    communities.map(async (c) => {
      const [membershipsRes, announcementsRes] = await Promise.all([
        apiFetch(`/communities/${c.id}/memberships`),
        apiFetch(`/communities/${c.id}/announcements`),
      ]);
      const memberships: MembershipRow[] = membershipsRes.ok ? (await membershipsRes.json()).data : [];
      const announcements: AnnouncementRow[] = announcementsRes.ok ? (await announcementsRes.json()).data : [];
      const memberCount = memberships.filter((m) => m.status !== "REMOVED").length;
      const postCount = announcements.filter((a) => a.state === "PUBLISHED").length;
      return {
        id: c.id,
        name: c.name,
        category: c.communityCategory,
        description: c.description ?? "",
        advisor: c.inchargeStaffId ? staffById.get(c.inchargeStaffId) ?? "—" : "Unassigned",
        memberCount,
        postCount,
      };
    }),
  );

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold leading-[1.08] tracking-[-0.015em] text-text">Community</h1>
          <p className="mt-2 text-[15px] text-text-muted">Clubs, members and what gets shared with parents</p>
        </div>
        <CreateCommunityModal years={years} defaultAcademicYearId={currentYear?.id} />
      </div>

      <CommunityListClient clubs={clubs} />
    </div>
  );
}
