import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ShellNavItem } from "@/components/dashboard/Shell";
import { AppShell } from "@/components/shared-ui/AppShell";
import { shellNavItemsToGroups } from "@/components/shared-ui/shell-nav";
import { HeaderBell } from "@/components/shared-ui/HeaderBell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

// Health In-charge console: the school nurse / infirmary desk. Same Shell as every other
// role (one design system, only nav + role label differ). Its own route namespace
// (/health-incharge/*) so it never shares a path with the read-only Admin/Principal
// /health oversight pages.
const NAV_ITEMS: ShellNavItem[] = [
  { href: "/health-incharge", label: "Dashboard", icon: "dashboard" },
  { href: "/health-incharge/visits", label: "Infirmary visits", icon: "attendance" },
  { href: "/health-incharge/students", label: "Student health", icon: "students" },
  { href: "/health-incharge/alerts", label: "Health alerts", icon: "announcements" },
  { href: "/health-incharge/escalations", label: "Parent & doctor contacts", icon: "requests" },
];

interface MeResponse {
  data: { person: { id: string; firstName: string; lastName: string | null } };
}

export default async function HealthInchargeLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) redirect("/login");

  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");
  // Not the real security boundary (every /health-incharge/* API route enforces
  // HEALTH_INCHARGE itself); this just stops any other login seeing the shell by URL.
  if (!actor.roles.includes("HEALTH_INCHARGE")) redirect("/login");

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  return (
    <AppShell
      rootHref="/health-incharge"
      navGroups={shellNavItemsToGroups(NAV_ITEMS)}
      personName={personName}
      personRoleLabel="Health In-charge"
      searchPlaceholder="Search health pages…"
      profileHref="/health-incharge/profile"
      headerExtra={<HeaderBell pendingRequestsCount={0} requestsHref="/health-incharge/alerts" />}
    >
      {children}
    </AppShell>
      );
}
