import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell, type ShellNavItem } from "@/components/dashboard/Shell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
// logoutAction is genuinely shared across every role (Admin/Finance/Library/
// Principal/Media already reuse it directly from here) -- see finance/layout.tsx's
// own comment for why it lives under admin/ rather than a role-specific action.
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

// Phase 2 gave this exactly one nav item ("Dashboard"). Phase 4 added
// "Communities" (read-only PTA view). Phase 5 added "Proposals". Phase 6 adds
// "Activities" -- initialized from a Community's own APPROVED proposal
// (backend entity is community_initiative, not community_activity -- see
// 0010_community_initiatives.sql for the naming collision this avoids). Phase
// 12 adds "Profile" -- the one community this login represents specifically
// (role_assignment.scope_id), distinct from "Communities" below which
// deliberately shows every community (Phase 4's oversight-view scope). Kept
// near the top (right after Dashboard) since it's the identity/roster hub a
// Community user returns to most -- "settings" gear swapped for the existing
// IdCardIcon (already used elsewhere, e.g. admin's own dashboard tile), a
// closer semantic fit for "who this login represents" than a system-settings
// icon; no new icon drawn, per this icon set's own "never introduce a new nav
// icon" rule (icons.tsx).
const COMMUNITY_NAV_ITEMS: ShellNavItem[] = [
  { href: "/community", label: "Dashboard", icon: "dashboard" },
  { href: "/community/profile", label: "Profile", icon: "profile" },
  { href: "/community/community", label: "Communities", icon: "community" },
  { href: "/community/proposals", label: "Proposals", icon: "requests" },
  { href: "/community/activities", label: "Activities", icon: "calendar" },
];

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function CommunityLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) redirect("/login");

  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");
  // Matches every other role's layout guard (Admin/Finance/Principal/Library/
  // Media) -- without this, any authenticated login could open /community by
  // URL regardless of role.
  if (!actor.roles.includes("COMMUNITY")) redirect("/login");

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  return (
    <Shell
      personName={personName}
      roleLabel="Community"
      onSignOut={logoutAction}
      pendingRequestsCount={0}
      navItems={COMMUNITY_NAV_ITEMS}
      // Shell's notification bell always renders a link (its default is
      // /admin/requests, an Admin-only route this role would just bounce off
      // of) -- there's no requests/approvals concept for Community yet, so
      // point it at the one real Community page instead of a route that
      // would redirect a Community user straight back to /login.
      requestsHref="/community"
      showGlobalSearch={false}
    >
      {children}
    </Shell>
  );
}
