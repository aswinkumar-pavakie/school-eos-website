import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell, type ShellNavItem } from "@/components/dashboard/Shell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

// Same Shell as Admin/Finance/Media (src/components/dashboard/Shell.tsx) -- one
// design system, only the nav items and role label differ per role. FACULTY is
// a broad role code (every teaching staff member, not just Sports In-Charge) --
// this section itself scopes down to whichever sport(s) this signed-in account
// actually holds a SPORTS_FACULTY role_assignment for (see sports-faculty-api.ts's
// own header comment); an account with none just sees empty lists everywhere.
const NAV_ITEMS: ShellNavItem[] = [
  { href: "/sports", label: "Dashboard", icon: "dashboard" },
  { href: "/sports/teams", label: "Teams & Roster", icon: "sports" },
  { href: "/sports/training", label: "Training & Attendance", icon: "attendance" },
  { href: "/sports/tournaments", label: "Tournaments & Fixtures", icon: "calendar" },
  { href: "/sports/achievements", label: "Achievements", icon: "reports" },
  { href: "/sports/profiles", label: "Player Profiles", icon: "students" },
  { href: "/sports/equipment", label: "Equipment", icon: "inventory" },
  { href: "/sports/od-requests", label: "OD Requests", icon: "requests" },
];

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function SportsFacultyLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) redirect("/login");

  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");
  // Matches every other role's layout (Admin/Finance/Media/Library) -- without
  // this, any authenticated login could open /sports by URL.
  if (!actor.roles.includes("FACULTY")) redirect("/login");

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  return (
    <Shell
      personName={personName}
      roleLabel="Sports Faculty"
      onSignOut={logoutAction}
      pendingRequestsCount={0}
      navItems={NAV_ITEMS}
      requestsHref="/sports/od-requests"
      showGlobalSearch={false}
    >
      {children}
    </Shell>
  );
}
