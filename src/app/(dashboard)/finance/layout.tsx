import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell, type ShellNavItem } from "@/components/dashboard/Shell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { getPurchaseOrdersSummary, getPurchaseRequestsSummary, listApprovals } from "@/lib/finance-api";
// logoutAction is genuinely shared with the Admin Console — see its own file for why
// it lives there rather than in a since-removed placeholder /dashboard route.
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

// Same Shell as the Admin Console (src/components/dashboard/Shell.tsx) — one design
// system, not a second one invented for Finance. Only the nav items, role label and
// pending-count source differ per role; the sidebar/top-bar chrome itself is shared
// code, not a lookalike rebuild.
//
// Nav is flat (no group headers) to match Shell/Admin's own convention exactly.
// Icons are reused across a few items — Shell's fixed icon set (Design Architecture
// v0.1 §15) is deliberately small and wasn't built with Finance's own sub-pages in
// mind; reusing the closest existing icon beats inventing new ones that don't match
// that spec.
//
// Finance/Admin get the full module; Principal — who only ever raises Purchase/Service
// Requests and decides items routed to them (fee structure activation, above-petty
// expenses, refunds, purchase requests) — gets a deliberately narrow nav. The backend's
// own @Roles guards are the real boundary; this just avoids advertising links that
// would 403.
const FULL_NAV_ITEMS: ShellNavItem[] = [
  { href: "/finance", label: "Dashboard", icon: "dashboard" },
  { href: "/finance/fee-payments", label: "Fee Payments", icon: "students" },
  { href: "/finance/payments", label: "Payments", icon: "finance" },
  { href: "/finance/obligations", label: "Obligations", icon: "reports" },
  { href: "/finance/fee-structures", label: "Fee Structures", icon: "academics" },
  { href: "/finance/fee-heads", label: "Fee Structure Items", icon: "settings" },
  { href: "/finance/concessions", label: "Concessions", icon: "finance" },
  { href: "/finance/education-loan-dd", label: "Education Loan DD", icon: "finance" },
  { href: "/finance/expenses", label: "Expenses", icon: "maintenance" },
  { href: "/finance/pop-approval", label: "POP Approval", icon: "requests" },
  { href: "/finance/sop-approval", label: "SOP Approval", icon: "requests" },
  { href: "/finance/approvals", label: "Other Approvals", icon: "audit" },
  { href: "/finance/pop-tracking", label: "POP Tracking", icon: "transport" },
  { href: "/finance/sop-tracking", label: "SOP Tracking", icon: "transport" },
];

const PRINCIPAL_NAV_ITEMS: ShellNavItem[] = [
  { href: "/finance/purchase-requests", label: "Purchase & Service Requests", icon: "requests" },
  { href: "/finance/approvals", label: "Approvals", icon: "audit" },
];

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function FinanceLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");
  const isFinanceOrAdmin = actor.roles.includes("FINANCE") || actor.roles.includes("ADMIN");

  // Real name for the avatar/menu — same direct /auth/me fetch pattern Admin's own
  // layout uses (getCurrentActor() only returns personId/roles, not a display name).
  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";
  const roleLabel = isFinanceOrAdmin ? "Finance" : "Principal";

  const navItems = isFinanceOrAdmin ? FULL_NAV_ITEMS : PRINCIPAL_NAV_ITEMS;

  // The bell's one real, honest "notification" -- this role's own pending approvals
  // count, straight off the same generic engine the Approvals inbox itself uses.
  const pendingRequestsCount = await listApprovals({ status: "PENDING" })
    .then((rows) => rows.length)
    .catch(() => 0);

  return (
    <Shell
      personName={personName}
      roleLabel={roleLabel}
      onSignOut={logoutAction}
      pendingRequestsCount={pendingRequestsCount}
      navItems={navItems}
      requestsHref="/finance/approvals"
      showGlobalSearch={false}
    >
      {children}
    </Shell>
  );
}
