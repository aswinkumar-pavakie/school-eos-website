import type { LibraryIconId } from "./icons";

export interface LibraryNavItem {
  href: string;
  label: string;
  icon: LibraryIconId;
}

export interface LibraryNavGroup {
  label: string;
  items: LibraryNavItem[];
}

// Group labels/order/items match the design's own sidebar exactly (Overview /
// Catalogue / Circulation / Members / Administration, 12 items). "More" is a
// 5th, real, working group the design doesn't show -- Reservations and Audit
// / History are genuine, already-built screens (see library-api.ts's own
// listReservations/listLibraryAudit), kept reachable rather than dropped,
// same "extra trailing group" approach the Faculty rebuild used for its own
// real-but-undesigned nav items.
export const LIBRARY_NAV_GROUPS: LibraryNavGroup[] = [
  { label: "Overview", items: [{ href: "/library", label: "Dashboard", icon: "dashboard" }] },
  {
    label: "Catalogue",
    items: [
      { href: "/library/books", label: "Books", icon: "books" },
      { href: "/library/ebooks", label: "eBooks", icon: "ebooks" },
      { href: "/library/catalogue", label: "Subjects & racks", icon: "catrack" },
    ],
  },
  {
    label: "Circulation",
    items: [
      { href: "/library/circulation", label: "Issue books", icon: "issue" },
      { href: "/library/returns", label: "Returns & renewals", icon: "returns" },
      { href: "/library/fines", label: "Overdue & fines", icon: "overdue" },
      { href: "/library/lost-damaged", label: "Lost & damaged", icon: "lost" },
      { href: "/library/history", label: "Borrowing history", icon: "history" },
    ],
  },
  { label: "Members", items: [{ href: "/library/members", label: "Library members", icon: "members" }] },
  {
    label: "Administration",
    items: [
      { href: "/library/reports", label: "Reports", icon: "reports" },
      { href: "/library/configuration", label: "Settings", icon: "settings" },
    ],
  },
  {
    label: "More",
    items: [
      { href: "/library/reservations", label: "Reservations", icon: "reservations" },
      { href: "/library/audit", label: "Audit / History", icon: "audit" },
      // "Ask the Assistant" moved to the navbar AskAiWidget -- no longer a
      // sidebar entry, matching the reference design.
    ],
  },
];
