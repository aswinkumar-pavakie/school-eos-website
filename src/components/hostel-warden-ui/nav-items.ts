import type { HostelWardenIconId } from "./icons";

export interface HostelWardenNavItem {
  id: HostelWardenIconId;
  label: string;
  href: string;
}

export interface HostelWardenNavGroup {
  label: string;
  items: HostelWardenNavItem[];
}

// Ported verbatim from the design's own `NAV` array (4 groups, 11 items) in
// brain/SIS HOSTEL WARDEN/Warden Console.dc.html -- same group labels, same
// order, same item labels. `href` is this build's own addition (the design
// uses an in-page `view` state machine instead of routes).
// Ported from the design's own `TITLES` map (id -> [title, subtitle]), used
// by HostelWardenShell to render the exact same dynamic header per screen
// the design shows (driven there by view state, here by pathname). Two
// subtitles are corrected here, deliberately, against the confirmed real
// backend workflow (see repo research notes) rather than ported verbatim:
// "Movement log" (the design's copy implies the warden authors exits; the
// real workflow is parent-submitted, warden-approved) and "Hostel details"
// (the design's copy implies full CRUD; a warden's real access is read-only,
// hostel-structure CRUD is Admin's). Every other entry matches the source.
export const HOSTEL_WARDEN_TITLES: Record<string, [string, string]> = {
  dashboard: ["Dashboard", "Occupancy, students out of the hostel and today's gate movement"],
  approvals: ["Movement log", "Gate pass and emergency exit requests from parents — review and decide"],
  students: ["Student details", "Block-wise resident register with room, guardian and fee state"],
  leave: ["Leave register", "Overnight leave approved for students — days away and purpose"],
  study: ["Study hours", "Morning and evening study hour attendance, marked by the warden in the study hall"],
  gate: ["Check-in / check-out", "Gate register — exits and returns for approved passes"],
  // Not part of the design's own nav at all (confirmed by design-file audit
  // -- same finding as the mobile app's own build: this screen is genuinely
  // orphaned in the mock). Added here for real reachability -- night roll
  // call is a real, already-built feature that needs a home now that
  // "gate" itself means the real Check-in/check-out register instead.
  attendance: ["Night attendance", "Nightly roll call for every boarder in this wing"],
  hostels: ["Hostel details", "Block and room records for this wing, maintained by Admin"],
  rooms: ["Rooms & occupancy", "Bed-level allotment across all blocks"],
  fees: ["Hostel fees", "Fee status for boarders in this wing"],
  complaints: ["Issues & maintenance", "Issues the warden notes on the block round or hears from a student in person"],
  reports: ["Reports", "Generated statements and exports"],
  assistant: ["Ask the Assistant", "Ask a question about school records, policies or anything else"],
};

export const HOSTEL_WARDEN_NAV: HostelWardenNavGroup[] = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/hostel-warden" },
      { id: "approvals", label: "Movement log", href: "/hostel-warden/movement-log" },
    ],
  },
  {
    label: "Students",
    items: [
      { id: "students", label: "Student details", href: "/hostel-warden/students" },
      { id: "leave", label: "Leave register", href: "/hostel-warden/leave" },
      { id: "study", label: "Study hours", href: "/hostel-warden/study-hours" },
      { id: "gate", label: "Check-in / check-out", href: "/hostel-warden/gate" },
      { id: "attendance", label: "Night attendance", href: "/hostel-warden/night-attendance" },
    ],
  },
  {
    label: "Hostel",
    items: [
      { id: "hostels", label: "Hostel details", href: "/hostel-warden/hostels" },
      { id: "rooms", label: "Rooms & occupancy", href: "/hostel-warden/rooms" },
      { id: "fees", label: "Hostel fees", href: "/hostel-warden/fees" },
    ],
  },
  {
    label: "Administration",
    items: [
      { id: "complaints", label: "Issues & maintenance", href: "/hostel-warden/issues" },
      { id: "reports", label: "Reports", href: "/hostel-warden/reports" },
      // "Ask the Assistant" moved to the navbar AskAiWidget -- no longer a
      // sidebar entry, matching the reference design.
    ],
  },
];
