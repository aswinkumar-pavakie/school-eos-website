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

const NAV_ITEMS: { href: string; label: string; icon: keyof typeof NAV_ICONS }[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/students", label: "Students", icon: "students" },
  { href: "/admin/parents", label: "Parents", icon: "parents" },
  { href: "/admin/faculty", label: "Faculty", icon: "faculty" },
  { href: "/admin/attendance", label: "Attendance", icon: "attendance" },
  { href: "/admin/academics", label: "Academics", icon: "academics" },
  { href: "/admin/community", label: "Communities", icon: "community" },
  { href: "/admin/transport", label: "Transport", icon: "transport" },
  { href: "/admin/hostel", label: "Hostel", icon: "hostel" },
  { href: "/admin/inventory", label: "Inventory", icon: "inventory" },
  { href: "/admin/maintenance", label: "Repair & Maintenance", icon: "maintenance" },
  { href: "/admin/finance", label: "Finance", icon: "finance" },
  { href: "/admin/timetable", label: "Timetable", icon: "timetable" },
  { href: "/admin/academic-calendar", label: "Academic Calendar", icon: "calendar" },
  { href: "/admin/reports", label: "Reports", icon: "reports" },
  { href: "/admin/announcements", label: "Announcements", icon: "announcements" },
  { href: "/admin/audit", label: "Audit Log", icon: "audit" },
  { href: "/admin/requests", label: "Requests & Approvals", icon: "requests" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

interface ShellProps {
  personName: string;
  roleLabel: string;
  onSignOut: () => Promise<void>;
  /** Real pending Admin approval requests (Requests & Approvals) -- the one
   * honest thing the bell has to say today, not a fabricated alerts feed. */
  pendingRequestsCount?: number;
  children: ReactNode;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const NOTIF_SEEN_STORAGE_KEY = "school-eos:notif-seen-count";

export function Shell({ personName, roleLabel, onSignOut, pendingRequestsCount = 0, children }: ShellProps) {
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
        style={{ width: collapsed ? 64 : 264 }}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          {!collapsed && (
            <span className="truncate text-base font-extrabold text-text">School EOS</span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted hover:bg-bg"
          >
            <CollapseIcon className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = NAV_ICONS[item.icon];
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3.5 rounded-[11px] px-3.5 py-3 text-[14.5px] font-semibold transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-text hover:bg-bg"
                    } ${collapsed ? "justify-center px-2" : ""}`}
                  >
                    <Icon className="h-6 w-6 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-surface pl-5 pr-5 sm:pl-7 sm:pr-7">
          <div className="flex min-w-0 flex-1 items-center justify-end">
            <GlobalSearch />
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-text-muted md:flex">
              {roleLabel} · Institution
            </span>

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
                    href="/admin/requests"
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
