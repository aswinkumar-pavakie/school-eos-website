import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell, type ShellNavItem } from "@/components/dashboard/Shell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

// Same Shell as Admin/Finance (src/components/dashboard/Shell.tsx) -- one design
// system, not a second one invented for Media Room. Only the nav items and role
// label differ per role; the sidebar/top-bar chrome itself is shared code.
const NAV_ITEMS: ShellNavItem[] = [
  { href: "/media", label: "Dashboard", icon: "dashboard" },
  { href: "/media/social-publishing", label: "Social Media Publishing", icon: "announcements" },
  { href: "/media/shoot-assignments", label: "Shoot Assignments", icon: "calendar" },
  { href: "/media/inventory", label: "Inventory", icon: "inventory" },
  { href: "/media/raise-indent", label: "Raise Indent", icon: "requests" },
  { href: "/media/team", label: "Media Team", icon: "faculty" },
];

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function MediaLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) redirect("/login");

  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  return (
    <Shell
      personName={personName}
      roleLabel="Media Room Head"
      onSignOut={logoutAction}
      pendingRequestsCount={0}
      navItems={NAV_ITEMS}
      requestsHref="/media/raise-indent"
      showGlobalSearch={false}
    >
      {children}
    </Shell>
  );
}
