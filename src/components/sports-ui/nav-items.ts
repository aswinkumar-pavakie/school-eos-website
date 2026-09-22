import type { ComponentType, CSSProperties } from "react";
import {
  AchievementsIcon,
  BudgetIcon,
  CalendarIcon,
  CoachesIcon,
  DashboardIcon,
  FixturesIcon,
  HousesIcon,
  IndentsIcon,
  InjuriesIcon,
  InventoryIcon,
  MessagesIcon,
  OdIcon,
  PtIcon,
  SessionsIcon,
  StudentsIcon,
  TeamsIcon,
  TrialsIcon,
} from "./icons";

export interface SportsNavItem {
  id: string;
  Icon: ComponentType<{ style?: CSSProperties }>;
  label: string;
  href: string;
  countKey?: string;
}
export interface SportsNavGroup {
  title: string;
  items: SportsNavItem[];
}

// Ported 1:1 from the design's own sidebar (OVERVIEW / PLAYERS / PROGRAMME /
// RESOURCES groups, same order, same labels) -- brain/Copy of Sports admin
// school dashboard design/Sports Admin School.dc.html's own NAV const.
export const SPORTS_NAV: SportsNavGroup[] = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", Icon: DashboardIcon, label: "Dashboard", href: "/sports-admin" },
      { id: "calendar", Icon: CalendarIcon, label: "Calendar", href: "/sports-admin/calendar" },
    ],
  },
  {
    title: "Players",
    items: [
      { id: "students", Icon: StudentsIcon, label: "Students / players", href: "/sports-admin/students" },
      { id: "teams", Icon: TeamsIcon, label: "Teams & squads", href: "/sports-admin/teams" },
      { id: "trials", Icon: TrialsIcon, label: "Trials & selection", href: "/sports-admin/trials" },
      { id: "houses", Icon: HousesIcon, label: "Houses & inter-house", href: "/sports-admin/houses" },
      { id: "od", Icon: OdIcon, label: "On-duty (OD)", href: "/sports-admin/od", countKey: "od" },
    ],
  },
  {
    title: "Programme",
    items: [
      { id: "pt", Icon: PtIcon, label: "PT / sports periods", href: "/sports-admin/pt" },
      { id: "sessions", Icon: SessionsIcon, label: "Training sessions", href: "/sports-admin/sessions" },
      { id: "fixtures", Icon: FixturesIcon, label: "Fixtures", href: "/sports-admin/fixtures" },
      { id: "achievements", Icon: AchievementsIcon, label: "Achievements", href: "/sports-admin/achievements" },
    ],
  },
  {
    title: "Resources",
    items: [
      { id: "coaches", Icon: CoachesIcon, label: "Coaches & PT staff", href: "/sports-admin/coaches" },
      { id: "inventory", Icon: InventoryIcon, label: "Equipment", href: "/sports-admin/equipment", countKey: "inventory" },
      { id: "indents", Icon: IndentsIcon, label: "Indents", href: "/sports-admin/indents", countKey: "indents" },
      { id: "injuries", Icon: InjuriesIcon, label: "Injuries & incidents", href: "/sports-admin/injuries" },
      { id: "budget", Icon: BudgetIcon, label: "Budget & approvals", href: "/sports-admin/budget" },
      { id: "messages", Icon: MessagesIcon, label: "Messages", href: "/sports-admin/messages" },
    ],
  },
  // "Ask the Assistant" moved to the navbar AskAiWidget -- no longer a
  // sidebar entry, matching the reference design.
];
