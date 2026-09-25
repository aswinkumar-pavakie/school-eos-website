"use client";

// Chrome (navbar/sidebar/logout/profile row) delegates entirely to the one
// shared AppShell (src/components/shared-ui/AppShell.tsx) -- identical markup
// to every other role's login, per the product owner's explicit instruction.
// Only Canteen's own real data lives here: its nav items and sign-out.

import { Outfit, JetBrains_Mono } from "next/font/google";
import { NavIcon } from "./icons";
import { AppShell } from "../shared-ui/AppShell";
import "../../app/(dashboard)/canteen/canteen-theme.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit-can",
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono-can",
});

const NAV_ITEMS = [
  { href: "/canteen", label: "Dashboard", icon: "dashboard" as const },
  { href: "/canteen/ledger", label: "Ledger", icon: "ledger" as const },
  { href: "/canteen/inventory", label: "Inventory", icon: "inventory" as const },
  { href: "/canteen/reports", label: "Reports", icon: "reports" as const },
  { href: "/canteen/history", label: "Ledger History", icon: "history" as const },
];

export function CanteenShell({
  personName,
  children,
}: {
  personName: string;
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}) {
  const navGroups = [
    {
      label: "OVERVIEW",
      items: NAV_ITEMS.map((item) => ({
        href: item.href,
        label: item.label,
        icon: <NavIcon id={item.icon} stroke="var(--color-text-muted)" />,
        activeIcon: <NavIcon id={item.icon} stroke="var(--color-primary)" />,
      })),
    },
  ];

  return (
    <div className={`canteen-scope ${outfit.variable} ${jetBrainsMono.variable}`}>
      <AppShell
        rootHref="/canteen"
        navGroups={navGroups}
        personName={personName}
        personRoleLabel="Canteen counter"
        searchPlaceholder="Search Dashboard, Ledger, History…"
        profileHref="/canteen/profile"
        showAiWidget={false}
      >
        {children}
      </AppShell>
    </div>
  );
}
