"use client";

// Chrome (navbar/sidebar/logout/profile row) delegates entirely to the one
// shared AppShell (src/components/shared-ui/AppShell.tsx) -- identical markup
// to every other role's login, per the product owner's explicit instruction.
// Only Library's own real data lives here: its nav items, the academic year,
// the toast provider, and sign-out.

import type { ReactNode } from "react";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { NavIcon } from "./icons";
import { LIBRARY_NAV_GROUPS } from "./nav-items";
import { ToastProvider } from "./toast/ToastProvider";
import { AppShell, type AppShellNavGroup } from "../shared-ui/AppShell";
import "../../app/(dashboard)/library/library-theme.css";

// Fonts are loaded only inside this route group -- other roles' bundles never
// pay for them. Variable names are deliberately distinct from other roles'.
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit-lib",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

export function LibraryShell({
  personName,
  academicYear,
  children,
}: {
  personName: string;
  academicYear: string;
  onSignOut: () => Promise<void>;
  children: ReactNode;
}) {
  const navGroups: AppShellNavGroup[] = LIBRARY_NAV_GROUPS.map((g) => ({
    label: g.label.toUpperCase(),
    items: g.items.map((item) => ({
      href: item.href,
      label: item.label,
      icon: <NavIcon id={item.icon} stroke="var(--color-text-muted)" />,
      activeIcon: <NavIcon id={item.icon} stroke="var(--color-primary)" />,
    })),
  }));

  return (
    <ToastProvider>
      <div className={`library-scope ${outfit.variable} ${jetbrainsMono.variable}`}>
        <AppShell
          rootHref="/library"
          navGroups={navGroups}
          personName={personName}
          personRoleLabel="Librarian"
          academicYear={academicYear}
          searchPlaceholder="Jump to a page — books, issue, reports…"
          profileHref="/library/profile"
        >
          {children}
        </AppShell>
      </div>
    </ToastProvider>
  );
}
