"use client";

// Chrome (navbar/sidebar/logout/profile row) delegates entirely to the one
// shared AppShell (src/components/shared-ui/AppShell.tsx) -- identical markup
// to every other role's login, per the product owner's explicit instruction.
// Only Media's own real data lives here: its nav items + real counts, the
// academic year, and sign-out.

import type { ReactNode } from "react";
import { MEDIA_NAV } from "./nav-items";
import { FlashProvider } from "./FlashContext";
import { AppShell, type AppShellNavGroup } from "../shared-ui/AppShell";
import "../../app/(dashboard)/media/media-theme.css";

export function MediaShell({
  personName,
  academicYearLabel,
  inventoryCount,
  indentCount,
  children,
}: {
  personName: string;
  personEmail: string;
  academicYearLabel: string;
  inventoryCount: number;
  indentCount: number;
  onSignOut: () => void | Promise<void>;
  children: ReactNode;
}) {
  const counts: Record<string, number> = { inventory: inventoryCount, indent: indentCount };

  const navGroups: AppShellNavGroup[] = MEDIA_NAV.map((group) => ({
    label: group.title.toUpperCase(),
    items: group.items.map((item) => ({
      href: item.href,
      label: item.label,
      icon: <item.Icon />,
      badge: item.countKey ? counts[item.countKey] : undefined,
    })),
  }));

  return (
    <FlashProvider>
      <div className="media-scope">
        <AppShell
          rootHref="/media"
          navGroups={navGroups}
          personName={personName}
          personRoleLabel="Media room head"
          academicYear={academicYearLabel}
          termLabel="Odd Semester"
          searchPlaceholder="Search shoots, indents, equipment..."
          profileHref="/media/profile"
        >
          {children}
        </AppShell>
      </div>
    </FlashProvider>
  );
}
