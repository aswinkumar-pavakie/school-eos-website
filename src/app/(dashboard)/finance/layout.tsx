import Link from "next/link";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { getPurchaseOrdersSummary, getPurchaseRequestsSummary } from "@/lib/finance-api";
import { logoutAction } from "@/app/dashboard/actions";

// Sidebar arrangement mirrors a reference billing/finance portal's structure (grouped
// sections, Students as the central hub, Fee Structures split from its reusable line
// items, POP/SOP Approval and POP/SOP Tracking as their own distinct pages rather than
// one combined view) — adapted to School EOS's own product/schema: Grade+Academic Year
// instead of Department+Batch, community_category instead of an invented "quota"
// field, and billing+finance unified into this one module rather than split across
// two. Deliberately NOT copied: the reference's "Fund available / total fund" KPI —
// School EOS has no budget/fund-ceiling concept in its schema, so that number would
// have to be fabricated; omitted rather than faked.
//
// Finance/Admin get the full module; Principal — who only ever raises Purchase/Service
// Requests and decides items routed to them (fee structure activation, above-petty
// expenses, refunds, purchase requests) — gets a deliberately narrow nav. The backend's
// own @Roles guards are the real boundary; this just avoids advertising links that
// would 403.
function fullNavGroups(badges: { pop: number; sop: number; popTracking: number; sopTracking: number }) {
  return [
    { label: "Overview", items: [{ href: "/finance", label: "Dashboard" }] },
    {
      label: "Billing",
      items: [
        { href: "/finance/fee-payments", label: "Fee Payments" },
        { href: "/finance/obligations", label: "Demand" },
      ],
    },
    {
      label: "Masters",
      items: [
        { href: "/finance/fee-structures", label: "Fee Structures" },
        { href: "/finance/fee-heads", label: "Fee Structure Items" },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/finance/concessions", label: "Concessions" },
        { href: "/finance/education-loan-dd", label: "Education Loan DD" },
        { href: "/finance/expenses", label: "Expenses" },
      ],
    },
    {
      label: "Approvals",
      items: [
        { href: "/finance/pop-approval", label: "POP Approval", badge: badges.pop },
        { href: "/finance/sop-approval", label: "SOP Approval", badge: badges.sop },
        { href: "/finance/approvals", label: "Other Approvals" },
      ],
    },
    {
      label: "Tracking & History",
      items: [
        { href: "/finance/pop-tracking", label: "POP", badge: badges.popTracking },
        { href: "/finance/sop-tracking", label: "SOP", badge: badges.sopTracking },
      ],
    },
  ];
}

const PRINCIPAL_NAV_GROUPS: { label: string; items: { href: string; label: string; badge?: number }[] }[] = [
  {
    label: "Requests",
    items: [{ href: "/finance/purchase-requests", label: "Purchase & Service Requests" }],
  },
  {
    label: "Approvals",
    items: [{ href: "/finance/approvals", label: "Approvals" }],
  },
];

export default async function FinanceLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.get(ACCESS_TOKEN_COOKIE)?.value) {
    redirect("/login");
  }

  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");
  const isFinanceOrAdmin = actor.roles.includes("FINANCE") || actor.roles.includes("ADMIN");
  const headerLabel = isFinanceOrAdmin ? "Finance" : "Principal";

  let navGroups: { label: string; items: { href: string; label: string; badge?: number }[] }[] = PRINCIPAL_NAV_GROUPS;
  if (isFinanceOrAdmin) {
    // Real pending-decision / awaiting-allotment counts, straight off the same
    // backend aggregates the POP/SOP pages themselves use — never a placeholder.
    const [popSummary, sopSummary, popOrders, sopOrders] = await Promise.all([
      getPurchaseRequestsSummary("GOODS"),
      getPurchaseRequestsSummary("SERVICE"),
      getPurchaseOrdersSummary("GOODS"),
      getPurchaseOrdersSummary("SERVICE"),
    ]).catch(() => [null, null, null, null]);
    navGroups = fullNavGroups({
      pop: popSummary?.pendingCount ?? 0,
      sop: sopSummary?.pendingCount ?? 0,
      popTracking: popOrders?.awaitingAllotmentCount ?? 0,
      sopTracking: sopOrders?.awaitingAllotmentCount ?? 0,
    });
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-border px-5">
          <span className="text-sm font-extrabold tracking-wide text-text">School EOS</span>
        </div>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1 text-[11px] font-bold tracking-[0.09em] text-text-muted uppercase">{group.label}</p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-[var(--radius-input)] px-3 py-2.5 text-sm font-bold text-text hover:bg-field"
                  >
                    <span>{item.label}</span>
                    {!!item.badge && (
                      <span className="rounded-[var(--radius-pill)] bg-field px-2 py-0.5 font-mono text-xs text-text-muted">{item.badge}</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-5">
          <span className="text-sm font-bold text-text-muted">{headerLabel}</span>
          <form action={logoutAction}>
            <button type="submit" className="text-sm font-bold text-text-muted hover:text-text">
              Sign out
            </button>
          </form>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
