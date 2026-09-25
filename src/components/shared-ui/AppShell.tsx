"use client";

// ONE real shared shell (sidebar + navbar/header) for every role login --
// extracted verbatim from faculty-ui/FacultyShell.tsx, which the product
// owner confirmed by screenshot as the correct reference design. Every role
// using this component renders byte-identical chrome (logo tile, nav list,
// profile row, search box, AI widget, role/year/term pills) -- only the
// real data differs per role (nav items, labels, badge counts, search
// domain). No role's actual data-fetching, routes, or business logic is
// touched by this file; it only ever receives already-fetched real data as
// props.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AskAiWidget, AI_CHAT_PANEL_WIDTH } from "../ai-chat/AskAiWidget";

export interface AppShellNavItem {
  href: string;
  label: string;
  icon: ReactNode;
  activeIcon?: ReactNode;
  badge?: number;
}
export interface AppShellNavGroup {
  label: string;
  items: AppShellNavItem[];
}

function isActive(pathname: string, href: string, rootHref: string): boolean {
  if (href === rootHref) return pathname === rootHref;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function findActiveHref(pathname: string, groups: AppShellNavGroup[], rootHref: string): string | null {
  let best: string | null = null;
  for (const g of groups) {
    for (const item of g.items) {
      if (!isActive(pathname, item.href, rootHref)) continue;
      if (best === null || item.href.length > best.length) best = item.href;
    }
  }
  return best;
}

const svgBase = { viewBox: "0 0 24 24", fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function SearchIcon() {
  return (
    <svg {...svgBase} width="15" height="15" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.2-3.2" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg {...svgBase} width="14" height="14" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg {...svgBase} width="16" height="16" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function AppShell({
  rootHref,
  schoolInitials = "PP",
  schoolName = "Pavakie",
  schoolSubtitle = "Public School",
  navGroups,
  personName,
  personRoleLabel,
  academicYear,
  termLabel,
  searchPlaceholder = "Search…",
  profileHref,
  headerExtra,
  footerExtra,
  sidebarBeforeNav,
  customSearch,
  showAiWidget = true,
  children,
}: {
  rootHref: string;
  schoolInitials?: string;
  schoolName?: string;
  schoolSubtitle?: string;
  navGroups: AppShellNavGroup[];
  personName: string;
  /** Shown in both the sidebar footer and the topbar pill -- e.g. "Faculty", "Parent", "Principal". */
  personRoleLabel: string;
  academicYear?: string;
  termLabel?: string;
  searchPlaceholder?: string;
  profileHref: string;
  /** Extra header controls, rendered right after the AI widget (e.g. a role-specific action button). */
  headerExtra?: ReactNode;
  /** Extra content in the sidebar footer row, after the profile link (e.g. AccountSwitcher). */
  footerExtra?: ReactNode;
  /** Extra content in the sidebar, above the nav groups (e.g. a child switcher). */
  sidebarBeforeNav?: ReactNode;
  /** Replaces the built-in "search my own nav pages" box entirely, in the
   * exact same header slot/position -- for a role whose real search already
   * queries actual records (e.g. Principal/Admin/Correspondent/Vice
   * Principal/Finance's own GlobalSearch across Students/Faculty/Parents),
   * so migrating that role onto this shared shell never drops that real
   * capability down to a plain nav-page search. */
  customSearch?: ReactNode;
  /** Defaults to true (every role's shell had the Ask-AI control). Pass false for a role that never had it, so migrating it doesn't add a capability. */
  showAiWidget?: boolean;
  children: ReactNode;
}) {
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const activeHref = useMemo(() => findActiveHref(pathname, navGroups, rootHref), [pathname, navGroups, rootHref]);

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [searchOpen]);

  const navResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results: { title: string; sub: string; href: string }[] = [];
    for (const g of navGroups) {
      for (const item of g.items) {
        if (item.label.toLowerCase().includes(q)) {
          results.push({ title: item.label, sub: g.label, href: item.href });
        }
      }
    }
    return results;
  }, [query, navGroups]);

  const initials =
    personName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        marginRight: aiChatOpen ? AI_CHAT_PANEL_WIDTH : 0,
        transition: "margin-right 300ms ease",
      }}
    >
      <aside
        style={{
          width: 266,
          flex: "0 0 266px",
          background: "var(--color-surface)",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <Link
          href={rootHref}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "18px 18px 16px",
            borderBottom: "1px solid var(--color-divider)",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--color-navy)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              font: "700 15px/1 var(--font-sans)",
              flexShrink: 0,
            }}
          >
            {schoolInitials}
          </div>
          <div>
            <div style={{ font: "700 16px/1.1 var(--font-sans)", color: "var(--color-navy)" }}>{schoolName}</div>
            <div style={{ font: "400 11.5px/1.3 var(--font-sans)", color: "var(--color-text-muted)", letterSpacing: ".02em" }}>
              {schoolSubtitle}
            </div>
          </div>
        </Link>

        <nav style={{ flex: 1, overflow: "auto", padding: "16px 12px 8px" }}>
          {sidebarBeforeNav}
          {navGroups.map((g) => (
            <div key={g.label} style={{ marginBottom: 16 }}>
              {g.label && (
                <div style={{ font: "600 10.5px/1 var(--font-sans)", letterSpacing: ".1em", color: "var(--color-text-tertiary)", padding: "0 12px 9px" }}>
                  {g.label}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {g.items.map((item) => {
                  const active = item.href === activeHref;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        width: "100%",
                        textAlign: "left",
                        border: 0,
                        cursor: "pointer",
                        padding: "9px 12px",
                        borderRadius: 9,
                        font: "500 14px/1.25 var(--font-sans)",
                        background: active ? "var(--color-tint)" : "transparent",
                        color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                        textDecoration: "none",
                      }}
                    >
                      <span style={{ display: "flex", flexShrink: 0 }}>{active && item.activeIcon ? item.activeIcon : item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span style={{ font: "500 11px/1 var(--font-mono)", color: "var(--color-text-tertiary)" }}>{item.badge}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderTop: "1px solid var(--color-divider)",
            background: "var(--color-surface)",
            paddingRight: footerExtra ? 12 : 0,
          }}
        >
          <Link
            href={profileHref}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              flex: 1,
              minWidth: 0,
              textAlign: "left",
              padding: "14px 16px",
              border: 0,
              background: "var(--color-surface)",
              textDecoration: "none",
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                flex: "0 0 36px",
                borderRadius: "50%",
                background: "var(--color-navy)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                font: "600 13px/1 var(--font-sans)",
              }}
            >
              {initials}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  font: "600 14px/1.2 var(--font-sans)",
                  color: "var(--color-text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {personName}
              </span>
              <span style={{ display: "block", font: "400 12px/1.3 var(--font-sans)", color: "var(--color-text-muted)" }}>{personRoleLabel}</span>
            </span>
            <ChevronRightIcon />
          </Link>
          {footerExtra}
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "13px 26px",
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          {customSearch ?? (
          <div ref={searchRef} style={{ flex: 1, maxWidth: 560, position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--color-field)",
                border: "1px solid var(--color-border)",
                borderRadius: 9,
                padding: "9px 12px",
              }}
            >
              <SearchIcon />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder={searchPlaceholder}
                style={{ flex: 1, minWidth: 0, border: 0, background: "none", font: "400 14px/1.2 var(--font-sans)", color: "var(--color-text)", outline: "none" }}
              />
              {!query && (
                <span style={{ font: "500 11px/1 var(--font-mono)", color: "var(--color-text-tertiary)", background: "var(--color-hover-fill)", borderRadius: 5, padding: "3px 6px" }}>
                  Ctrl K
                </span>
              )}
              {searchOpen && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSearchOpen(false);
                  }}
                  style={{ border: 0, background: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "0 2px" }}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
            {searchOpen && query.trim() && (
              <div
                style={{
                  position: "absolute",
                  top: 50,
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  boxShadow: "var(--shadow-dropdown)",
                  maxHeight: 440,
                  overflow: "auto",
                  padding: 8,
                }}
              >
                <div style={{ font: "600 10.5px/1 var(--font-sans)", letterSpacing: ".09em", color: "var(--color-text-tertiary)", padding: "8px 10px 10px" }}>
                  {navResults.length} result{navResults.length === 1 ? "" : "s"}
                </div>
                {navResults.map((r) => (
                  <button
                    key={r.href}
                    type="button"
                    onClick={() => {
                      router.push(r.href);
                      setQuery("");
                      setSearchOpen(false);
                    }}
                    style={{
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      textAlign: "left",
                      gap: 12,
                      border: 0,
                      background: "var(--color-surface)",
                      cursor: "pointer",
                      borderRadius: 9,
                      padding: 10,
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", font: "600 14.5px/1.3 var(--font-sans)", color: "var(--color-text)" }}>{r.title}</span>
                      <span style={{ display: "block", font: "400 12.5px/1.4 var(--font-sans)", color: "var(--color-text-tertiary)" }}>{r.sub}</span>
                    </span>
                    <span
                      style={{
                        font: "600 11px/1 var(--font-sans)",
                        letterSpacing: ".06em",
                        color: "var(--color-primary)",
                        background: "var(--color-tint)",
                        borderRadius: 20,
                        padding: "6px 10px",
                      }}
                    >
                      PAGE
                    </span>
                  </button>
                ))}
                {navResults.length === 0 && (
                  <div style={{ padding: "26px 12px", textAlign: "center", font: "400 14px/1.5 var(--font-sans)", color: "var(--color-text-tertiary)" }}>
                    No matches for that search.
                  </div>
                )}
              </div>
            )}
          </div>
          )}
          <div style={{ flex: 1 }} />
          {showAiWidget && <AskAiWidget onOpenChange={setAiChatOpen} />}
          {headerExtra}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--color-divider)",
              borderRadius: 8,
              padding: "8px 14px",
              font: "500 13.5px/1 var(--font-sans)",
              color: "var(--color-navy)",
            }}
          >
            {personRoleLabel}
          </div>
          {academicYear && (
            <div style={{ font: "500 13.5px/1 var(--font-sans)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "9px 13px" }}>
              {academicYear}
            </div>
          )}
          {termLabel && (
            <div style={{ border: 0, background: "var(--color-navy)", color: "#fff", font: "600 13.5px/1 var(--font-sans)", borderRadius: 8, padding: "10px 15px" }}>
              {termLabel}
            </div>
          )}
        </header>

        <main style={{ flex: 1, padding: "28px 26px 56px", maxWidth: 1480, width: "100%" }}>{children}</main>
      </div>
    </div>
  );
}
