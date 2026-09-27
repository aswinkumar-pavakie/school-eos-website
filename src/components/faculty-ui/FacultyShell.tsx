"use client";

// Chrome (navbar/sidebar/logout/profile row) delegates entirely to the one
// shared AppShell (src/components/shared-ui/AppShell.tsx) -- extracted from
// this file's own previous markup (the product owner's confirmed-correct
// reference design), so every other role's shell renders byte-identical
// chrome instead of a separate hand-copied file. Only Faculty's own real
// data lives here: nav items, the account switcher, sign-out (handled by
// the page itself, unchanged).

import { NavIcon } from "./icons";
import { ToastProvider } from "./toast/ToastProvider";
import type { FacultyNavGroup } from "./nav-items";
import { AccountSwitcher, type SwitcherData } from "./AccountSwitcher";
import "../../app/(dashboard)/faculty/faculty-theme.css";
import { AppShell, type AppShellNavGroup } from "../shared-ui/AppShell";

export function FacultyShell({
  personName,
  sectionRoleLabel,
  academicYear,
  navGroups,
  switcher,
  children,
}: {
  /** Present only when this login can switch (Faculty with a class login, or
   * a Class Teacher login); omitted for a plain Faculty with nothing to
   * switch to, so their footer is unchanged. */
  switcher?: SwitcherData;
  personName: string;
  /** e.g. "Class teacher · 8-B" -- shown identically in both the sidebar
   * footer and the topbar pill, matching the design exactly. */
  sectionRoleLabel: string;
  academicYear: string;
  navGroups: FacultyNavGroup[];
  children: React.ReactNode;
}) {
  const sharedNavGroups: AppShellNavGroup[] = navGroups.map((g) => ({
    label: g.label,
    items: g.items.map((item) => ({
      href: item.href,
      label: item.label,
      icon: <NavIcon id={item.icon} stroke="var(--fac-body-muted)" />,
      activeIcon: <NavIcon id={item.icon} stroke="var(--fac-primary)" />,
      badge: item.badge,
    })),
  }));

  return (
    <ToastProvider>
      <div className="faculty-scope">
        <AppShell
          rootHref="/faculty"
          navGroups={sharedNavGroups}
          personName={personName}
          personRoleLabel={sectionRoleLabel}
          academicYear={academicYear}
          termLabel="Term 1"
          searchPlaceholder="Search students, parents, notices, pages…"
          profileHref="/faculty/profile"
          footerExtra={switcher ? <AccountSwitcher data={switcher} /> : undefined}
        >
          {children}
        </AppShell>
      </div>
    </ToastProvider>
  );
}
