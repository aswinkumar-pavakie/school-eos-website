import type { ParentIconId } from "./icons";

export interface ParentNavItem {
  id: string;
  icon: ParentIconId;
  label: string;
  href: string;
  /** true = this item's real pending count feeds a badge (Daily Tasks: real
   * pending homework/assignment count; Fees: real overdue installments) */
  countKey?: "homework" | "fees";
}
export interface ParentNavGroup {
  title: string;
  items: ParentNavItem[];
}

// Ported 1:1 from the design's own navDefs (overview/academics/child groups,
// same order, same labels) -- brain/Copy of Parent web login design/Parent
// Web Portal.dc.html.
export const PARENT_NAV: ParentNavGroup[] = [
  {
    title: "Overview",
    items: [
      { id: "home", icon: "home", label: "Home", href: "/parent" },
      { id: "notices", icon: "notices", label: "Notices", href: "/parent/notices" },
    ],
  },
  {
    title: "Academics",
    items: [
      { id: "dailytasks", icon: "dailytasks", label: "Daily Tasks", href: "/parent/homework", countKey: "homework" },
      { id: "online", icon: "online", label: "Online class", href: "/parent/online-class" },
      { id: "academics", icon: "academics", label: "Current term", href: "/parent/term" },
      { id: "timetable", icon: "timetable", label: "Timetable", href: "/parent/timetable" },
      { id: "calendar", icon: "calendar", label: "Academic calendar", href: "/parent/calendar" },
    ],
  },
  {
    title: "My class",
    items: [
      { id: "attendance", icon: "attendance", label: "Attendance", href: "/parent/attendance" },
      { id: "performance", icon: "performance", label: "Performance", href: "/parent/results" },
      { id: "fees", icon: "fees", label: "Fees", href: "/parent/fees", countKey: "fees" },
      { id: "meetings", icon: "meetings", label: "Meetings", href: "/parent/meetings" },
      { id: "library", icon: "library", label: "Library", href: "/parent/library" },
      { id: "messages", icon: "messages", label: "Messages", href: "/parent/messages" },
      { id: "documents", icon: "documents", label: "Documents", href: "/parent/documents" },
      { id: "feedback", icon: "feedback", label: "Feedback", href: "/parent/feedback" },
    ],
  },
  {
    // Real, already-working features that simply aren't part of this
    // design file's own scope -- kept reachable rather than dropped (same
    // "MORE" convention used for Academic Coordinator's own extra items).
    title: "More",
    items: [
      { id: "exams", icon: "academics", label: "Exam schedule", href: "/parent/exams" },
      { id: "subjects", icon: "academics", label: "Subjects", href: "/parent/subjects" },
      { id: "health", icon: "feedback", label: "Health", href: "/parent/health" },
      { id: "leave", icon: "documents", label: "Leave requests", href: "/parent/leave" },
      { id: "bus", icon: "timetable", label: "My Bus", href: "/parent/bus" },
      { id: "settings", icon: "documents", label: "Settings", href: "/parent/settings" },
      // Not in the design's own nav (new feature, added after the pixel
      // replication) -- reuses the "myclass" icon path, otherwise unused
      // anywhere in this module, rather than inventing a new one.
      { id: "assistant", icon: "myclass", label: "Ask the Assistant", href: "/parent/ai-chat" },
    ],
  },
];
