"use client";

// Chrome (navbar/sidebar/logout/profile row) delegates entirely to the one
// shared AppShell (src/components/shared-ui/AppShell.tsx) -- identical markup
// to every other role's login, per the product owner's explicit instruction.
// Only Sports Admin's own real data lives here: its nav items + real pending
// counts, the academic year, and sign-out.

import type { ReactNode } from "react";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { SPORTS_NAV } from "./nav-items";
import { AppShell, type AppShellNavGroup } from "../shared-ui/AppShell";
import "../../app/(dashboard)/sports-admin/sports-theme.css";

// Design Architecture.dc.html's canonical fonts -- these loaders back the
// --font-outfit / --font-jetbrains-mono variables the sports theme reads.
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

export function SportsShell({
  personName,
  academicYearLabel,
  odCount,
  indentsCount,
  children,
}: {
  personName: string;
  academicYearLabel: string;
  odCount: number;
  indentsCount: number;
  onSignOut: () => void | Promise<void>;
  children: ReactNode;
}) {
  const counts: Record<string, number> = { od: odCount, indents: indentsCount };

  const navGroups: AppShellNavGroup[] = SPORTS_NAV.map((group) => ({
    label: group.title.toUpperCase(),
    items: group.items.map((item) => ({
      href: item.href,
      label: item.label,
      icon: <item.Icon />,
      badge: item.countKey ? counts[item.countKey] : undefined,
    })),
  }));

  return (
    <div className={`sports-scope ${outfit.variable} ${jetBrainsMono.variable}`}>
      <AppShell
        rootHref="/sports-admin"
        navGroups={navGroups}
        personName={personName}
        personRoleLabel="Sports admin"
        academicYear={academicYearLabel}
        termLabel="Term I"
        searchPlaceholder="Search players, squads, fixtures, kit..."
        profileHref="/sports-admin/profile"
      >
        {children}
      </AppShell>
    </div>
  );
}
