import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell, type ShellNavItem } from "@/components/dashboard/Shell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
// logoutAction is genuinely shared across Admin/Finance/Library/Principal (see
// finance/layout.tsx's own comment for why it lives under admin/) -- Transport
// Manager reuses the exact same one, not a new sign-out implementation.
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

// Transport Manager's own operational shell -- same Shell component Admin/
// Principal/Finance/Library use. Full surface: Overview, the read-only fleet
// views Admin's own panels already support (readOnly prop), Bus Allocation's
// one real write (driver/vehicle/route assignment), Students (read-only
// transport mapping), and the monitoring/reporting screens (Live Tracking,
// NFC/boarding Attendance, Trips, Reports) backed by transport-ops.
const TRANSPORT_MANAGER_NAV_ITEMS: ShellNavItem[] = [
  { href: "/transport-manager", label: "Overview", icon: "dashboard", group: "MAIN" },

  { href: "/transport-manager/buses", label: "Buses", icon: "transport", group: "OPERATIONS" },
  { href: "/transport-manager/drivers", label: "Drivers", icon: "faculty", group: "OPERATIONS" },
  { href: "/transport-manager/routes", label: "Routes", icon: "transport", group: "OPERATIONS" },
  { href: "/transport-manager/allocation", label: "Bus Allocation", icon: "transport", group: "OPERATIONS" },
  { href: "/transport-manager/students", label: "Students", icon: "students", group: "OPERATIONS" },

  { href: "/transport-manager/live-tracking", label: "Live Tracking", icon: "transport", group: "MONITORING" },
  { href: "/transport-manager/nfc-attendance", label: "NFC Attendance", icon: "attendance", group: "MONITORING" },
  { href: "/transport-manager/trips", label: "Trips", icon: "timetable", group: "MONITORING" },

  { href: "/transport-manager/reports", label: "Reports", icon: "reports", group: "REPORTS" },
];

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function TransportManagerLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");
  // Deliberately TRANSPORT_MANAGER-only, not "|| ADMIN" -- matching Principal's
  // own precedent (Admin's oversight of another role's module is a separate,
  // narrower page under /admin/*, never "viewing as" that role's own
  // operational shell). Every backend endpoint under /transport-ops/* already
  // enforces @Roles('ADMIN', 'TRANSPORT_MANAGER') -- this redirect isn't the
  // real security boundary, it just avoids a non-Transport-Manager seeing the
  // shell render before every data fetch on the page 401s out from under them.
  if (!actor.roles.includes("TRANSPORT_MANAGER")) redirect("/login");

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  return (
    <Shell
      personName={personName}
      roleLabel="Transport Manager"
      onSignOut={logoutAction}
      pendingRequestsCount={0}
      navItems={TRANSPORT_MANAGER_NAV_ITEMS}
      requestsHref="/transport-manager"
      showGlobalSearch={false}
    >
      {children}
    </Shell>
  );
}
