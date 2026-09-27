// Server-safe helper (deliberately NOT a "use client" file, so server-component
// layouts can call it): converts the Reframe-cluster roles' existing flat
// ShellNavItem[] (icon id + inline `group` field, dashboard/Shell.tsx's own
// shape) into the grouped shape the shared AppShell takes. Reuses the same
// shared icon set (dashboard/icons.tsx's NAV_ICONS), so migrating a role from
// Shell.tsx to AppShell never needs new icon components.

import { NAV_ICONS } from "../dashboard/icons";
import type { AppShellNavGroup } from "./AppShell";

export function shellNavItemsToGroups(
  items: { href: string; label: string; icon: keyof typeof NAV_ICONS; group?: string; badge?: string | number }[],
): AppShellNavGroup[] {
  const groups: AppShellNavGroup[] = [];
  for (const item of items) {
    const label = item.group ?? "";
    let group = groups.find((g) => g.label === label);
    if (!group) {
      group = { label, items: [] };
      groups.push(group);
    }
    const Icon = NAV_ICONS[item.icon];
    group.items.push({
      href: item.href,
      label: item.label,
      icon: <Icon className="h-5 w-5 shrink-0 text-text-muted" />,
      activeIcon: <Icon className="h-5 w-5 shrink-0 text-primary" />,
      badge: typeof item.badge === "number" ? item.badge : item.badge !== undefined ? Number(item.badge) || undefined : undefined,
    });
  }
  return groups;
}
