// Admin's own nav list -- moved verbatim out of dashboard/Shell.tsx into a
// server-safe file (Shell.tsx is a client module, so a server-component layout
// can't read a plain array exported from it). Shell.tsx imports it back as its
// default navItems, so every existing caller behaves exactly as before.

import type { ShellNavItem } from "./Shell";

// Group labels/order/item-order below are pixel-matched to the new SIS ADMIN
// reference (C:\...\SIS ADMIN\Admin Portal.dc.html, its own `nav` array,
// line 3936-3943: OVERVIEW / PEOPLE / ACADEMICS / OPERATIONS /
// ADMINISTRATION) wherever a real existing page covers that item. Every real
// Admin capability the reference's own (much smaller) nav doesn't mention at
// all -- Parents, Finance, Communities, Reports, Audit Log, Access control,
// Settings, Organization, the separate Sports module, Health & Infirmary, the
// Coming Soon stubs -- is kept, never deleted, appended in its own trailing
// group so real functionality stays reachable. "Faculty" (not the
// reference's own "Teachers" wording) is kept per the user's own explicit
// separate instruction to standardize on one name everywhere. The reference's
// own "Admissions" group (Enroll students / Admit faculty) is now real --
// each is its own dedicated multi-section admission page, not a modal, real
// backend end to end (see each page.tsx's own header comment). "Enroll
// parents" is this app's own addition (not in the reference's own nav at
// all) for the same reason: real parent-account-creation + student-linking,
// previously only reachable via a modal buried on the Parents list page, now
// a first-class admissions destination too. The reference's own "Inbox" item
// is now real too -- "Messages" below, wired to the real E2EE messaging
// microservice (the user's own later instruction to connect messaging for
// every role except device-credential-only logins). "Subjects & mapping" used to be in that same
// bucket (Admin's own Subjects data only lived inside Academics' own tab bar)
// -- it now has its own dedicated, real-write page at
// /admin/academics/subjects-mapping (see that page.tsx's own header comment),
// added below right after "Academics" and before "Class timetable", the
// reference's own sidebar ordering.
export const ADMIN_NAV_ITEMS: ShellNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", group: "OVERVIEW" },

  { href: "/admin/students", label: "Students", icon: "students", group: "PEOPLE" },
  { href: "/admin/faculty", label: "Faculty", icon: "faculty", group: "PEOPLE" },
  { href: "/admin/parents", label: "Parents", icon: "parents", group: "PEOPLE" },

  { href: "/admin/students/enroll", label: "Enroll students", icon: "students", group: "ADMISSIONS" },
  { href: "/admin/faculty/admit", label: "Admit faculty", icon: "faculty", group: "ADMISSIONS" },
  // No standalone "Enroll parents" admission entry (removed 2026-09-16) --
  // Enroll Students' own guardian fields already support "search existing OR
  // create new" (ExistingParentPicker), and a parent's own account creation
  // is the Parents list page's "+ New parent" (CreateParentModal). A
  // dedicated admission page for parents alone added a second, overlapping
  // path to the same real POST /persons + guardian-link without a real
  // admission-time need distinct from those two.

  { href: "/admin/academics", label: "Academics", icon: "academics", group: "ACADEMICS" },
  { href: "/admin/academics/subjects-mapping", label: "Subjects & mapping", icon: "subjectMapping", group: "ACADEMICS" },
  { href: "/admin/attendance", label: "Staff attendance", icon: "attendance", group: "ACADEMICS" },
  { href: "/admin/attendance-diary", label: "Attendance diary", icon: "attendance", group: "ACADEMICS" },
  { href: "/admin/timetable", label: "Class timetable", icon: "timetable", group: "ACADEMICS" },
  // Stub -- see src/app/(dashboard)/admin/examination-timetable/page.tsx. Reuses the
  // "timetable" icon; no dedicated icon exists for this yet.
  { href: "/admin/examination-timetable", label: "Exam timetable", icon: "examTimetable", group: "ACADEMICS" },
  { href: "/admin/academic-calendar", label: "Academic calendar", icon: "calendar", group: "ACADEMICS" },
  // Not in the reference's own nav -- kept, real exam/exam_subject data.
  { href: "/admin/examinations", label: "Examinations", icon: "reports", group: "ACADEMICS" },

  // "Sports inventory" per the reference's own wording -- this is the same
  // real /admin/inventory page Principal/Vice Principal's own "Sports
  // inventory" oversight nav item already points at (equipment/stock, not
  // the separate Sports module below).
  { href: "/admin/inventory", label: "Sports inventory", icon: "inventory", group: "OPERATIONS" },
  { href: "/admin/maintenance", label: "Repair & maintenance", icon: "maintenance", group: "OPERATIONS" },
  { href: "/admin/hostel", label: "Hostel", icon: "hostel", group: "OPERATIONS" },
  { href: "/admin/transport", label: "Transport", icon: "transport", group: "OPERATIONS" },
  // Oversight-only page (src/app/(dashboard)/admin/library/page.tsx) — Admin never
  // gets Library's own operational shell, only a read-only summary.
  { href: "/admin/library", label: "Library", icon: "library", group: "OPERATIONS" },
  // Moved here from its own former "COMMUNICATION" group, relabelled
  // "Community" (singular) -- matches "SIS ADMIN with community"'s own
  // OPERATIONS list exactly (Sports inventory/Repair & maintenance/Hostel/
  // Transport/Library/Community, in this order). The feature itself was
  // rebuilt as real school Clubs to match that same reference; the
  // standalone Community login has been retired.
  { href: "/admin/community", label: "Community", icon: "community", group: "OPERATIONS" },
  // Not in the reference's own nav (it has a separate Sports module from
  // "Sports inventory" above) -- kept, real coaches/teams/tournaments data.
  { href: "/admin/sports", label: "Sports", icon: "sports", group: "OPERATIONS" },
  // Real data (health_profile/infirmary_visit/health_alert/medical_escalation/
  // emergency_treatment_consent, all already-existing tables, 1,120+ rows) --
  // not in the reference's own nav, kept. Reuses the "requests" icon (a
  // clipboard/checklist) -- no dedicated icon exists for a health record.
  { href: "/admin/health", label: "Health & Infirmary", icon: "requests", group: "OPERATIONS" },

  { href: "/admin/requests", label: "Requests & approvals", icon: "requests", group: "ADMINISTRATION" },
  { href: "/admin/messages", label: "Messages", icon: "messages", group: "ADMINISTRATION" },
  // Labelled "Notices" per the reference's own wording, matching Principal's
  // already-established choice for this same real Announcements route.
  { href: "/admin/announcements", label: "Notices", icon: "announcements", group: "ADMINISTRATION" },
  // Not in the reference's own nav -- kept, real functionality.
  { href: "/admin/reports", label: "Reports", icon: "reports", group: "ADMINISTRATION" },
  // "Audit Log" and "Identity, Roles & Assignments" nav entries removed
  // (explicit user request) -- both routes/backends still exist and work,
  // just no longer surfaced in the sidebar.

  // Everything below has no equivalent at all in the reference's own nav --
  // real Admin capability, kept in its own trailing groups rather than
  // deleted.
  { href: "/admin/finance", label: "Finance", icon: "finance", group: "FINANCE" },

  // "School / Institution Management" nav entry removed (explicit user
  // request -- it and Settings were genuinely the same surface). Its real
  // capability (Campuses, Departments -- already-existing APIs) wasn't
  // dropped, just folded into Settings as two more tabs; see SettingsTabs.tsx.
  { href: "/admin/settings", label: "Settings", icon: "settings", group: "SYSTEM" },

  // Moved to the navbar "Ask AI" widget (AskAiWidget in Shell's own header)
  // -- no longer a sidebar entry, matching the reference design.

  // These modules aren't built yet -- each route already exists and honestly
  // renders <ComingSoon/> (no fake data). "Camps" stays a stub deliberately --
  // the HLD doc flags it as an explicit open product-scope question ("in
  // scope for v1? -- Owner: Product"), not just unbuilt.
  { href: "/admin/camps", label: "Camps", icon: "sports", group: "COMING SOON" },
  { href: "/admin/emergency", label: "SOS / Emergency", icon: "audit", group: "COMING SOON" },
  { href: "/admin/wallet-canteen", label: "Wallet & Canteen", icon: "finance", group: "COMING SOON" },
];
