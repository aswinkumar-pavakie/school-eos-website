import type { ComponentType, CSSProperties } from "react";
import { AnalyticsIcon, CalendarIcon, DashboardIcon, IndentIcon, InventoryIcon, ShootsIcon, SocialIcon, TeamIcon } from "./icons";

export interface MediaNavItem {
  id: string;
  Icon: ComponentType<{ style?: CSSProperties }>;
  label: string;
  href: string;
  countKey?: "inventory" | "indent";
}
export interface MediaNavGroup {
  title: string;
  items: MediaNavItem[];
}

// Ported 1:1 from the design's own sidebar (OVERVIEW / PRODUCTION / RESOURCES
// groups, same order, same labels) -- brain/SIS Mediaroom/Media Room.dc.html.
// "Media Requests" (isRequests) is a real screen in the design's own state
// machine but has no sidebar entry and no go.requests action anywhere in the
// design's own JS -- genuinely unreachable in the source, so intentionally
// not linked here either.
export const MEDIA_NAV: MediaNavGroup[] = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", Icon: DashboardIcon, label: "Dashboard", href: "/media" },
      { id: "calendar", Icon: CalendarIcon, label: "Academic calendar", href: "/media/calendar" },
      { id: "analytics", Icon: AnalyticsIcon, label: "Report", href: "/media/report" },
    ],
  },
  {
    title: "Production",
    items: [
      { id: "social", Icon: SocialIcon, label: "Social media publishing", href: "/media/social-publishing" },
      { id: "shoots", Icon: ShootsIcon, label: "Shoot assignments", href: "/media/shoot-assignments" },
    ],
  },
  {
    title: "Resources",
    items: [
      { id: "inventory", Icon: InventoryIcon, label: "Inventory", href: "/media/inventory", countKey: "inventory" },
      { id: "indent", Icon: IndentIcon, label: "Raise indent", href: "/media/raise-indent", countKey: "indent" },
      { id: "team", Icon: TeamIcon, label: "Media team", href: "/media/team" },
    ],
  },
  // "Ask the Assistant" moved to the navbar AskAiWidget -- no longer a
  // sidebar entry, matching the reference design.
];
