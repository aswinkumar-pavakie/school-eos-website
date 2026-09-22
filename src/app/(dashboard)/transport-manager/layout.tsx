import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell, type ShellNavItem } from "@/components/dashboard/Shell";
import { TransportReframeThemeStyle, transportReframeThemeClassName } from "@/components/dashboard/TransportReframeTheme";
import { TransportSearch } from "@/components/transport/TransportSearch";
import { TransportHeaderChrome } from "@/components/transport/TransportHeaderChrome";
import { ACCESS_TOKEN_COOKIE, apiFetch, getCurrentActor } from "@/lib/api";
// logoutAction is genuinely shared across Admin/Finance/Library/Principal (see
// finance/layout.tsx's own comment for why it lives under admin/) -- Transport
// Manager reuses the exact same one, not a new sign-out implementation.
import { logoutAction } from "@/app/(dashboard)/admin/actions";
import { E2eeBootstrapMount } from "@/lib/e2ee/E2eeBootstrapMount";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

const REFRAME_SCOPE = "transport-theme";

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}
interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}
interface AcademicTerm {
  id: string;
  name: string;
  isCurrent: boolean;
}
interface School {
  name: string;
  code: string;
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

  const [meRes, vehiclesRes, routesRes, driversRes, attendantsRes, complianceRes, serviceDueRes, academicYearsRes, academicTermsRes, schoolRes] =
    await Promise.all([
      fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }),
      apiFetch("/vehicles"),
      apiFetch("/routes"),
      apiFetch("/drivers"),
      apiFetch("/attendants"),
      apiFetch("/vehicles/compliance-summary"),
      apiFetch("/vehicles/service-due"),
      apiFetch("/academic-years"),
      apiFetch("/academic-terms"),
      apiFetch("/school"),
    ]);
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";
  const school: School | null = schoolRes.ok ? ((await schoolRes.json()) as { data: School }).data : null;

  // Real nav badges -- every count below is a real row count from a real
  // endpoint (see each endpoint's own comment), never a placeholder. Service
  // due degrades to 0 until query.md's odometer columns are run (see
  // vehicle.repository.ts's own findServiceDueMap comment) -- an honest 0,
  // not a fabricated number.
  const vehicleCount: number = vehiclesRes.ok ? ((await vehiclesRes.json()) as { data: unknown[] }).data.length : 0;
  const routeCount: number = routesRes.ok ? ((await routesRes.json()) as { data: unknown[] }).data.length : 0;
  const driverCount: number = driversRes.ok ? ((await driversRes.json()) as { data: unknown[] }).data.length : 0;
  const attendantCount: number = attendantsRes.ok ? ((await attendantsRes.json()) as { data: unknown[] }).data.length : 0;
  const compliance: { expiring: number; overdue: number } = complianceRes.ok
    ? ((await complianceRes.json()) as { data: { expiring: number; overdue: number } }).data
    : { expiring: 0, overdue: 0 };
  const serviceDue: { vehicleId: string; currentOdometerKm: number | null; nextServiceDueKm: number | null }[] = serviceDueRes.ok
    ? ((await serviceDueRes.json()) as { data: { vehicleId: string; currentOdometerKm: number | null; nextServiceDueKm: number | null }[] }).data
    : [];
  const dueForServiceCount = serviceDue.filter(
    (s) => s.currentOdometerKm !== null && s.nextServiceDueKm !== null && s.currentOdometerKm >= s.nextServiceDueKm,
  ).length;

  const academicYears: AcademicYear[] = academicYearsRes.ok ? ((await academicYearsRes.json()) as { data: AcademicYear[] }).data : [];
  const academicTerms: AcademicTerm[] = academicTermsRes.ok ? ((await academicTermsRes.json()) as { data: AcademicTerm[] }).data : [];
  const currentYear = academicYears.find((y) => y.isCurrent) ?? null;
  const currentTerm = academicTerms.find((t) => t.isCurrent) ?? null;

  // Bus Allocation is GONE as its own nav item/page -- per explicit
  // instruction, the design puts vehicle + route + crew assignment inside one
  // "Buses" feature, not three separate ones. Its one real write (vehicle-
  // route-assignment create/update) now lives directly on the bus detail page
  // (Edit crew / Edit route -- see buses/[id]/page.tsx's own comment).
  //
  // OVERVIEW/FLEET/PEOPLE/OPERATIONS below is the mockup's own real nav
  // structure and item set, copied exactly (Transport Module.dc.html's own
  // NAV array: Dashboard; Buses, Routes; Drivers & crew; Maintenance,
  // Compliance) -- Maintenance and Compliance are now real, separate
  // top-level pages (not folded into the bus detail page), matching the
  // mockup literally instead of my own earlier assumption. Every badge below
  // is a real count. MONITORING and REPORTS are this app's own real features
  // with no mockup equivalent at all -- kept in their own clearly-separate
  // groups (not squeezed into the mockup's "Operations" label, which the
  // mockup itself reserves for Maintenance/Compliance only) rather than
  // invented as mockup-labelled items.
  // materialIcon set only on the 6 items the mockup's own NAV array literally
  // defines (Transport Module.dc.html lines 1062-1067: dashboard/
  // directions_bus/alt_route/groups/build/description) -- every other item
  // below (Students, Live Tracking, Boarding Monitor, NFC Attendance, Trips,
  // Reports) has no mockup equivalent to verify a glyph name against, so it
  // keeps its existing shared SVG rather than a guessed icon name. A plain
  // glyph-name string, not a rendered element/function -- this array is built
  // in this Server Component and passed into the Client Component Shell,
  // which resolves materialIcon to a <MaterialIcon> itself (weight 300/
  // GRAD -25/size 20, copied from the mockup's own nav span literally).
  const TRANSPORT_MANAGER_NAV_ITEMS: ShellNavItem[] = [
    { href: "/transport-manager", label: "Dashboard", icon: "dashboard", group: "OVERVIEW", materialIcon: "dashboard" },

    { href: "/transport-manager/buses", label: "Buses", icon: "transport", group: "FLEET", badge: vehicleCount, materialIcon: "directions_bus" },
    { href: "/transport-manager/routes", label: "Routes", icon: "transport", group: "FLEET", badge: routeCount, materialIcon: "alt_route" },

    { href: "/transport-manager/drivers", label: "Drivers & crew", icon: "faculty", group: "PEOPLE", badge: driverCount + attendantCount, materialIcon: "groups" },
    { href: "/transport-manager/students", label: "Students", icon: "students", group: "PEOPLE" },

    { href: "/transport-manager/maintenance", label: "Maintenance", icon: "maintenance", group: "OPERATIONS", badge: dueForServiceCount, materialIcon: "build" },
    { href: "/transport-manager/compliance", label: "Compliance", icon: "audit", group: "OPERATIONS", badge: compliance.expiring, materialIcon: "description" },

    { href: "/transport-manager/live-tracking", label: "Live Tracking", icon: "transport", group: "MONITORING" },
    { href: "/transport-manager/boarding-monitor", label: "Boarding Monitor", icon: "attendance", group: "MONITORING" },
    { href: "/transport-manager/nfc-attendance", label: "NFC Attendance", icon: "attendance", group: "MONITORING" },
    { href: "/transport-manager/trips", label: "Trips", icon: "timetable", group: "MONITORING" },

    { href: "/transport-manager/reports", label: "Reports", icon: "reports", group: "REPORTS" },

    { href: "/transport-manager/messages", label: "Messages", icon: "messages", group: "REPORTS", materialIcon: "chat" },

    // Moved to the navbar "Ask AI" widget (AskAiWidget in Shell's own header)
    // -- no longer a sidebar entry, matching the reference design.
  ];

  return (
    <div className={transportReframeThemeClassName(REFRAME_SCOPE)}>
      {/* Material Symbols Outlined -- the mockup's own real icon system
          (every icon in Transport Module.dc.html is this font, by literal
          glyph name, e.g. line 14's own <link>). Declared here rather than
          in the root layout so it only ever loads on a Transport Manager
          page -- no other role's login pays for an icon font it doesn't use.
          Next's App Router hoists a <link> rendered anywhere in a Server
          Component tree into the document <head>, same mechanism already
          relied on for this route's own next/font/google fonts
          (design-reframe-fonts.ts) to apply without being declared in
          src/app/layout.tsx. */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,200..500,0,-25..0"
      />
      <TransportReframeThemeStyle scope={REFRAME_SCOPE} />
      <E2eeBootstrapMount personId={actor.personId} />
      <Shell
        personName={personName}
        roleLabel="Transport Manager"
        onSignOut={logoutAction}
        pendingRequestsCount={0}
        navItems={TRANSPORT_MANAGER_NAV_ITEMS}
        requestsHref="/transport-manager"
        customSearch={<TransportSearch />}
        headerExtra={<TransportHeaderChrome academicYearName={currentYear?.name} termName={currentTerm?.name} />}
        hideRolePill
        // Real school name/code (school.repository.ts's own singleton row) --
        // never a fabricated "PPS"/school name. Falls back to Shell's default
        // "School EOS" label (no sidebarHeader at all) if the school row
        // can't be read, rather than rendering an empty/broken tile.
        sidebarHeader={
          school && (
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#0F172A] text-[12.5px] font-extrabold text-white">
                {school.code}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14.5px] font-extrabold tracking-[-0.01em] text-text">{school.name}</p>
                <p className="text-[11.5px] font-semibold text-[#94A3B8]">Transport office</p>
              </div>
            </div>
          )
        }
      >
        {children}
      </Shell>
    </div>
  );
}
