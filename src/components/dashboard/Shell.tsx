"use client";

// Web shell -- Design Architecture v0.1 section 04: fixed sidebar (264px, collapses
// to a 64px icon rail below 1024), 56px top bar, 11-item Admin nav order (Dashboard,
// Students, Parents, Faculty, Academics, Communities, Transport, Hostel, Finance,
// Reports, Settings). Permission rule: a module a role can't use is removed from
// nav entirely, never shown disabled -- there's only one role (Admin) in this app,
// so nothing here is conditional yet.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BellIcon, CollapseIcon, NAV_ICONS } from "./icons";
import { GlobalSearch } from "./GlobalSearch";
import { MaterialIcon } from "../transport/MaterialIcon";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: keyof typeof NAV_ICONS;
  /** Optional real icon override, rendered instead of `NAV_ICONS[icon]` --
   * `icon` stays required either way (every other caller keeps rendering the
   * exact same SVG it always has). Only Transport Manager's own nav array
   * sets this, to render a real Material Symbols glyph matching its own
   * mockup's literal icon system instead of this app's shared hand-drawn SVG
   * set -- omitted entirely, this renders byte-identically to before. */
  /** A real Material Symbols Outlined glyph name (e.g. "directions_bus"),
   * used instead of `NAV_ICONS[icon]` when set -- a plain string, not a
   * function, because this array is built in a Server Component
   * (transport-manager/layout.tsx) and passed into this Client Component;
   * passing a function/JSX across that boundary throws at runtime. Shell
   * itself resolves it to a <MaterialIcon> with the same active/idle color
   * logic as every other icon below. Only Transport Manager's own nav array
   * sets this -- every other role's items are unaffected, unchanged fallback
   * to NAV_ICONS[item.icon]. */
  materialIcon?: string;
  /** Optional section header rendered immediately before this item, whenever it
   * differs from the previous item's group. Omitted entirely by Finance/Library's
   * own flat nav arrays, so their sidebars render with no headers, unchanged. */
  group?: string;
  /** Optional real count pill next to the label (e.g. a real "96" students
   * total, a real pending-approvals count) -- omitted entirely renders nothing,
   * so every existing caller's nav is unaffected. Never a placeholder/fake value. */
  badge?: string | number;
};

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
// a first-class admissions destination too. One item the reference's nav
// names still has NO real page behind it anywhere in this app and is
// deliberately NOT added as a dead link: "Inbox" (no messaging/inbox module
// exists in this schema at all). "Subjects & mapping" used to be in that same
// bucket (Admin's own Subjects data only lived inside Academics' own tab bar)
// -- it now has its own dedicated, real-write page at
// /admin/academics/subjects-mapping (see that page.tsx's own header comment),
// added below right after "Academics" and before "Class timetable", the
// reference's own sidebar ordering.
const ADMIN_NAV_ITEMS: ShellNavItem[] = [
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

  { href: "/admin/ai-chat", label: "Ask the Assistant", icon: "assistant", group: "SYSTEM" },

  // These modules aren't built yet -- each route already exists and honestly
  // renders <ComingSoon/> (no fake data). "Camps" stays a stub deliberately --
  // the HLD doc flags it as an explicit open product-scope question ("in
  // scope for v1? -- Owner: Product"), not just unbuilt.
  { href: "/admin/camps", label: "Camps", icon: "sports", group: "COMING SOON" },
  { href: "/admin/emergency", label: "SOS / Emergency", icon: "audit", group: "COMING SOON" },
  { href: "/admin/wallet-canteen", label: "Wallet & Canteen", icon: "finance", group: "COMING SOON" },
];

interface ShellProps {
  personName: string;
  roleLabel: string;
  onSignOut: () => Promise<void>;
  /** Real pending requests for whichever inbox this role has (Admin's Requests &
   * Approvals, Finance's own approvals engine) -- the one honest thing the bell has
   * to say today, not a fabricated alerts feed. */
  pendingRequestsCount?: number;
  /** Defaults to Admin's own nav so its existing usage is unaffected -- pass a
   * different list (and href, below) for another role's module using this same shell. */
  navItems?: ShellNavItem[];
  /** Bell's "view all" link and GlobalSearch's result hrefs both assume /admin/requests
   * and /admin/students-shaped routes; a role with its own equivalents overrides them
   * here instead of inheriting Admin's (which it likely can't reach). */
  requestsHref?: string;
  showGlobalSearch?: boolean;
  /** Replaces GlobalSearch entirely (same header slot/position) when a role's
   * own search domain is genuinely different from Students/Faculty/Parents
   * (e.g. Transport Manager's own buses/routes/drivers search) -- omitted
   * entirely keeps every existing caller's plain GlobalSearch unchanged.
   * Takes priority over showGlobalSearch when both are given. */
  customSearch?: ReactNode;
  /** Optional real content rendered in the header, right of the search box and
   * left of the role pill (e.g. Principal's real current-academic-year pill) --
   * omitted entirely renders nothing, so every existing caller is unaffected. */
  headerExtra?: ReactNode;
  /** Hides the header's own default "{roleLabel} · Institution" pill --
   * Transport Manager renders its own "Transport officer" pill (with a
   * shield icon, per the mockup's own literal markup) via headerExtra
   * instead, so the generic pill would otherwise show alongside a second,
   * redundant one. Defaults to false so every existing caller keeps its
   * current pill unchanged. */
  hideRolePill?: boolean;
  /** Optional real content replacing the sidebar's default "School EOS" label
   * (e.g. Principal's real school logo tile + name, per the SIS mockup) -- the
   * collapse toggle button still renders alongside it either way. Omitted
   * entirely keeps every existing caller's plain "School EOS" header. */
  sidebarHeader?: ReactNode;
  /** Optional real content rendered at the bottom of the sidebar, below the
   * nav (e.g. Principal's real avatar + name + role card, per the SIS
   * mockup). Omitted entirely renders nothing, same as every existing caller
   * today -- this is additive, not a replacement for the header's own
   * notification bell/sign-out menu, which stays exactly as-is. */
  sidebarFooter?: ReactNode;
  children: ReactNode;
}

function isActive(pathname: string, href: string, rootHref: string): boolean {
  if (href === rootHref) return pathname === rootHref;
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Some nav lists have a sibling item whose own href is a URL *prefix* of
// another sibling's (e.g. Principal's "Academics" at /principal/academics and
// "Class Timetable" at /principal/academics/class-timetable, grouped under
// the same path for URL-namespacing, not a real parent/child relationship).
// Matching each item independently would light up both at once -- only the
// single longest (most specific) matching href should ever be active.
function findActiveHref(pathname: string, navItems: ShellNavItem[]): string | null {
  let best: string | null = null;
  for (const item of navItems) {
    if (!isActive(pathname, item.href, navItems[0].href)) continue;
    if (best === null || item.href.length > best.length) best = item.href;
  }
  return best;
}

const NOTIF_SEEN_STORAGE_KEY = "school-eos:notif-seen-count";

export function Shell({
  personName,
  roleLabel,
  onSignOut,
  pendingRequestsCount = 0,
  navItems = ADMIN_NAV_ITEMS,
  requestsHref = "/admin/requests",
  showGlobalSearch = true,
  customSearch,
  headerExtra,
  hideRolePill = false,
  sidebarHeader,
  sidebarFooter,
  children,
}: ShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // "Read" here means "seen", persisted per browser -- it never touches the
  // real pending-request count or status, it just remembers how many of the
  // current pending requests this admin has already acknowledged, so the dot
  // clears until a NEW request pushes the count past what was last seen.
  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(NOTIF_SEEN_STORAGE_KEY));
      if (Number.isFinite(stored)) setSeenCount(stored);
    } catch {
      /* localStorage unavailable (private mode, etc.) -- dot just won't persist across reloads */
    }
  }, []);

  const hasUnseen = pendingRequestsCount > seenCount;

  function markNotificationsRead() {
    setSeenCount(pendingRequestsCount);
    try {
      localStorage.setItem(NOTIF_SEEN_STORAGE_KEY, String(pendingRequestsCount));
    } catch {
      /* best-effort */
    }
  }

  useEffect(() => {
    if (!menuOpen && !notifOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, notifOpen]);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`hidden shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-150 lg:flex ${
          collapsed ? "w-16" : "w-66"
        }`}
        style={{ width: collapsed ? 64 : 272 }}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          {!collapsed && (sidebarHeader ?? <span className="truncate text-base font-extrabold text-text">School EOS</span>)}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-bg"
          >
            <CollapseIcon className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-[14px] py-[18px] [scrollbar-color:#eaecf0_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent"
        >
          <ul className="flex flex-col gap-1">
            {(() => {
              const activeHref = findActiveHref(pathname, navItems);
              return navItems.map((item, i) => {
                const Icon = NAV_ICONS[item.icon];
                const active = item.href === activeHref;
                const showGroupHeader =
                  !collapsed && item.group !== undefined && item.group !== navItems[i - 1]?.group;
                return (
                  <li key={item.href}>
                    {showGroupHeader && (
                      <div
                        data-nav-group-label
                        className={`px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-text-muted ${
                          i === 0 ? "pt-0" : "pt-[14px]"
                        }`}
                      >
                        {item.group}
                      </div>
                    )}
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      data-nav-item={active ? "active" : "idle"}
                      className={`flex min-h-[44px] items-center gap-[10px] rounded-[10px] px-3 py-[11px] text-[15px] transition-colors ${
                        active ? "bg-primary/10 font-semibold text-primary" : "font-medium text-text hover:bg-bg"
                      } ${collapsed ? "justify-center px-2" : ""}`}
                    >
                      {item.materialIcon ? (
                        // Literal nav colors from Transport Module.dc.html's
                        // own navGroups logic (line 1075): active #0F172A
                        // (near-black, not the accent blue), idle #475569 (a
                        // real slate, darker/more saturated than this app's
                        // shared --color-text-muted #64748B).
                        <span className={`flex w-[22px] shrink-0 justify-center ${active ? "text-[#0F172A]" : "text-[#475569]"}`}>
                          <MaterialIcon name={item.materialIcon} size={20} weight={300} grade={-25} />
                        </span>
                      ) : (
                        <Icon className={`h-5 w-5 shrink-0 ${active ? "text-primary" : "text-text-muted"}`} />
                      )}
                      {/* line-clamp instead of a single-line truncate -- the sidebar's
                          272px width isn't quite wide enough at this padding/icon/gap
                          for the longest labels ("Requests & approvals") to fit on one
                          line without an ellipsis; wrapping to a 2nd line keeps every
                          label fully readable without shrinking padding, icon size, or
                          font for the many short labels that never needed it. */}
                      {!collapsed && <span className="line-clamp-2 flex-1 leading-[1.2]">{item.label}</span>}
                      {!collapsed && item.badge !== undefined && (
                        <span
                          data-nav-badge={active ? "active" : "idle"}
                          className={`shrink-0 rounded-[var(--radius-pill)] px-2 py-0.5 font-mono text-[11px] font-semibold ${
                            active ? "bg-primary/15 text-primary" : "bg-field text-text-muted"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              });
            })()}
          </ul>
        </nav>

        {!collapsed && sidebarFooter && (
          <div className="shrink-0 border-t border-border px-[18px] py-4">{sidebarFooter}</div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-surface pl-5 pr-5 sm:pl-7 sm:pr-7">
          <div className="flex min-w-0 flex-1 items-center justify-end">
            {customSearch ?? (showGlobalSearch && <GlobalSearch />)}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {headerExtra}
            {!hideRolePill && (
              <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-text-muted md:flex">
                {roleLabel} · School
              </span>
            )}

            <div className="relative shrink-0" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg"
              >
                <BellIcon className="h-[21px] w-[21px]" />
                {hasUnseen && (
                  <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 z-20 w-72 rounded-[14px] border border-border bg-surface p-1.5 shadow-lg">
                  <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                    <p className="text-xs font-bold uppercase tracking-[0.09em] text-text-muted">
                      Notifications
                    </p>
                    {hasUnseen && (
                      <button
                        type="button"
                        onClick={markNotificationsRead}
                        className="text-[11.5px] font-semibold text-primary hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                  <Link
                    href={requestsHref}
                    onClick={() => setNotifOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-[11px] px-2.5 py-2.5 text-sm text-text hover:bg-bg"
                  >
                    <span>
                      {pendingRequestsCount > 0
                        ? `${pendingRequestsCount} request${pendingRequestsCount === 1 ? "" : "s"} need${pendingRequestsCount === 1 ? "s" : ""} your review`
                        : "No pending requests"}
                    </span>
                    {pendingRequestsCount > 0 && (
                      <span className="shrink-0 rounded-[7px] bg-primary/10 px-2 py-0.5 font-mono text-[12px] font-semibold text-primary">
                        {pendingRequestsCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}
            </div>

            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-primary text-[13.5px] font-bold text-white"
              >
                {personName.slice(0, 1).toUpperCase()}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 z-20 w-52 rounded-[14px] border border-border bg-surface p-1.5 shadow-lg">
                  <div className="px-2.5 py-2">
                    <p className="truncate text-sm font-bold text-text">{personName}</p>
                    <p className="text-xs text-text-muted">{roleLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onSignOut()}
                    className="w-full rounded-[11px] px-2.5 py-2 text-left text-sm font-semibold text-critical-text hover:bg-critical-bg"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page padding -- Design Architecture v0.1 shell spec: 64 / 40 / 16px by tier. */}
        <main className="flex-1 overflow-y-auto bg-bg px-4 py-[18px] sm:px-10 lg:px-16 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
