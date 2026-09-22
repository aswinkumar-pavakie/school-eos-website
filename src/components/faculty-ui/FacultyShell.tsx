"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Outfit } from "next/font/google";
import { NavIcon } from "./icons";
import { SearchIcon, CloseIcon, ChevronRightIcon } from "./icons";
import { ToastProvider } from "./toast/ToastProvider";
import type { FacultyNavGroup } from "./nav-items";
import { AskAiWidget, AI_CHAT_PANEL_WIDTH } from "../ai-chat/AskAiWidget";
import "../../app/(dashboard)/faculty/faculty-theme.css";

// Font is loaded only inside this route group -- other roles' bundles never
// pay for it. See faculty-theme.css's own comment for the full token
// scoping strategy.
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

function isActive(pathname: string, href: string): boolean {
  if (href === "/faculty") return pathname === "/faculty";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function findActiveHref(pathname: string, groups: FacultyNavGroup[]): string | null {
  let best: string | null = null;
  for (const g of groups) {
    for (const item of g.items) {
      if (!isActive(pathname, item.href)) continue;
      if (best === null || item.href.length > best.length) best = item.href;
    }
  }
  return best;
}

export function FacultyShell({
  personName,
  sectionRoleLabel,
  academicYear,
  navGroups,
  children,
}: {
  personName: string;
  /** e.g. "Class teacher · 8-B" -- shown identically in both the sidebar
   * footer and the topbar pill, matching the design exactly. */
  sectionRoleLabel: string;
  academicYear: string;
  navGroups: FacultyNavGroup[];
  children: ReactNode;
}) {
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const activeHref = useMemo(() => findActiveHref(pathname, navGroups), [pathname, navGroups]);

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

  // Baseline search: nav pages only, client-side substring match -- always
  // available with zero backend dependency. Extending this to also index
  // students/notices/homework/permissions/exams/threads (as the design
  // intends) happens naturally as each of those screens' real data-fetching
  // is built in later phases; the search UI itself is already complete.
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

  const initials = personName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

  return (
    <ToastProvider>
      <div
        className={`faculty-scope ${outfit.variable}`}
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
            background: "var(--fac-white)",
            borderRight: "1px solid var(--fac-border)",
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: 0,
            height: "100vh",
          }}
        >
          <div
            className="fac-hover-lift"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "18px 18px 16px",
              borderBottom: "1px solid var(--fac-divider)",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "var(--fac-navy)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                font: "700 15px/1 var(--fac-font-sans)",
              }}
            >
              PP
            </div>
            <div>
              <div style={{ font: "700 16px/1.1 var(--fac-font-sans)", color: "var(--fac-navy)" }}>Pavakie</div>
              <div style={{ font: "400 11.5px/1.3 var(--fac-font-sans)", color: "var(--fac-body-muted)", letterSpacing: ".02em" }}>
                Public School
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, overflow: "auto", padding: "16px 12px 8px" }}>
            {navGroups.map((g) => (
              <div key={g.label} style={{ marginBottom: 16 }}>
                <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".1em", color: "var(--fac-tertiary)", padding: "0 12px 9px" }}>
                  {g.label}
                </div>
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
                          font: "500 14px/1.25 var(--fac-font-sans)",
                          background: active ? "var(--fac-tint)" : "transparent",
                          color: active ? "var(--fac-primary)" : "var(--fac-body)",
                        }}
                      >
                        <NavIcon id={item.icon} stroke={active ? "var(--fac-primary)" : "var(--fac-body-muted)"} />
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="fac-font-mono" style={{ font: "500 11px/1 var(--fac-font-mono)", color: "var(--fac-tertiary)" }}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <Link
            href="/faculty/profile"
            className="fac-hover-lift"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              width: "100%",
              textAlign: "left",
              padding: "14px 16px",
              border: 0,
              borderTop: "1px solid var(--fac-divider)",
              background: "var(--fac-white)",
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                flex: "0 0 36px",
                borderRadius: "50%",
                background: "var(--fac-navy)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                font: "600 13px/1 var(--fac-font-sans)",
              }}
            >
              {initials}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", font: "600 14px/1.2 var(--fac-font-sans)", color: "var(--fac-ink)" }}>{personName}</span>
              <span style={{ display: "block", font: "400 12px/1.3 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>{sectionRoleLabel}</span>
            </span>
            <ChevronRightIcon />
          </Link>
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
              background: "var(--fac-white)",
              borderBottom: "1px solid var(--fac-border)",
            }}
          >
            <div ref={searchRef} style={{ flex: 1, maxWidth: 560, position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--fac-panel)",
                  border: "1px solid var(--fac-border)",
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
                  placeholder="Search students, parents, notices, pages…"
                  style={{ flex: 1, minWidth: 0, border: 0, background: "none", font: "400 14px/1.2 var(--fac-font-sans)", color: "var(--fac-ink)" }}
                />
                {!query && (
                  <span
                    className="fac-font-mono"
                    style={{ font: "500 11px/1 var(--fac-font-mono)", color: "var(--fac-tertiary)", background: "var(--fac-chip)", borderRadius: 5, padding: "3px 6px" }}
                  >
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
                    style={{ border: 0, background: "none", cursor: "pointer", color: "var(--fac-body-muted)", padding: "0 2px" }}
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
                    background: "var(--fac-white)",
                    border: "1px solid var(--fac-border)",
                    borderRadius: 12,
                    boxShadow: "var(--fac-shadow-popover-strong)",
                    maxHeight: 440,
                    overflow: "auto",
                    padding: 8,
                  }}
                >
                  <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", padding: "8px 10px 10px" }}>
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
                      className="fac-hover-lift flex w-full items-center text-left"
                      style={{ gap: 12, border: 0, background: "var(--fac-white)", cursor: "pointer", borderRadius: 9, padding: 10 }}
                    >
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", font: "600 14.5px/1.3 var(--fac-font-sans)", color: "var(--fac-ink)" }}>{r.title}</span>
                        <span style={{ display: "block", font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>{r.sub}</span>
                      </span>
                      <span style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".06em", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 20, padding: "6px 10px" }}>
                        PAGE
                      </span>
                    </button>
                  ))}
                  {navResults.length === 0 && (
                    <div style={{ padding: "26px 12px", textAlign: "center", font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
                      No matches for that search.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }} />
            <AskAiWidget onOpenChange={setAiChatOpen} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--fac-divider)", borderRadius: 8, padding: "8px 14px", font: "500 13.5px/1 var(--fac-font-sans)", color: "var(--fac-navy)" }}>
              {sectionRoleLabel}
            </div>
            <div style={{ font: "500 13.5px/1 var(--fac-font-sans)", color: "var(--fac-body)", border: "1px solid var(--fac-border)", borderRadius: 8, padding: "9px 13px" }}>
              {academicYear}
            </div>
            <button
              type="button"
              style={{ border: 0, cursor: "pointer", background: "var(--fac-navy)", color: "#fff", font: "600 13.5px/1 var(--fac-font-sans)", borderRadius: 8, padding: "10px 15px" }}
            >
              Term 1
            </button>
            {/* Removed the duplicate "Message parents" button that used to sit
                here -- the sidebar's own "Message" nav item (OVERVIEW group)
                is the one real entry point into messaging now; having a
                second button here that led to the exact same screen was
                redundant clutter, not a second real feature. */}
          </header>

          <main style={{ flex: 1, padding: "28px 26px 56px", maxWidth: 1480, width: "100%" }}>{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
