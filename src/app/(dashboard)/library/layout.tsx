import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell, type ShellNavItem } from "@/components/dashboard/Shell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
// logoutAction is genuinely shared across Admin/Finance/Library -- see finance/layout.tsx's
// own comment for why it lives under admin/ rather than a since-removed placeholder route.
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

// Library's own operational shell -- same Shell component Admin/Finance use, only
// the nav items/role label differ. This route group is LIBRARY-only: Admin's
// oversight of Library lives in its own separate, much smaller /admin/library page
// (see src/app/(dashboard)/admin/library/page.tsx), not by "viewing as" Library here
// -- Admin must never become an alternative Library operator interface.
const LIBRARY_NAV_ITEMS: ShellNavItem[] = [
  { href: "/library", label: "Dashboard", icon: "dashboard" },
  { href: "/library/books", label: "Books", icon: "academics" },
  { href: "/library/members", label: "Members", icon: "students" },
  { href: "/library/circulation", label: "Circulation", icon: "requests" },
  { href: "/library/reservations", label: "Reservations", icon: "calendar" },
  { href: "/library/fines", label: "Fines", icon: "finance" },
  { href: "/library/lost-damaged", label: "Lost & Damaged", icon: "maintenance" },
  { href: "/library/reports", label: "Reports", icon: "reports" },
  { href: "/library/configuration", label: "Configuration", icon: "settings" },
  { href: "/library/audit", label: "Audit / History", icon: "audit" },
];

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function LibraryLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");
  // Deliberately LIBRARY-only, not "|| ADMIN" -- unlike Finance (which Admin can
  // also operate), Library's own operational shell is not something Admin should
  // be able to view-as; Admin's oversight is the separate /admin/library page.
  if (!actor.roles.includes("LIBRARY")) redirect("/login");

  // Real name for the avatar/menu -- same direct /auth/me fetch pattern Finance's
  // own layout uses (getCurrentActor() only returns personId/roles, not a display name).
  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  return (
    <Shell
      personName={personName}
      roleLabel="Library"
      onSignOut={logoutAction}
      navItems={LIBRARY_NAV_ITEMS}
      requestsHref="/library/fines"
      showGlobalSearch={false}
    >
      {children}
    </Shell>
  );
}
