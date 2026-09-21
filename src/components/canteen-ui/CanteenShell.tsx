"use client";

// Canteen counter's own shell -- pixel-matched value-for-value to
// FacultyShell.tsx (src/components/faculty-ui/), per explicit instruction:
// "same color same font same size text style text size color etc design
// exactly same... 100 percent... like others". Same sidebar width/padding/
// font sizes, same topbar search-bar treatment (Ctrl K chip, nav-only
// substring search), same hover-lift on every card (.can-hover-lift,
// canteen-theme.css, copied verbatim from .fac-hover-lift). Deliberately
// missing FacultyShell's Messenger modal and Message-parents/Term buttons
// -- those are Faculty-specific features with no Canteen equivalent, not
// omissions from the visual system itself.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Outfit, IBM_Plex_Mono } from "next/font/google";
import { NavIcon, SearchIcon, CloseIcon, SignOutIcon } from "./icons";
import "../../app/(dashboard)/canteen/canteen-theme.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit-can",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono-can",
});

const NAV_ITEMS = [
  { href: "/canteen", label: "Dashboard", icon: "dashboard" as const },
  { href: "/canteen/ledger", label: "Ledger", icon: "ledger" as const },
  { href: "/canteen/history", label: "History", icon: "history" as const },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/canteen") return pathname === "/canteen";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CanteenShell({
  personName,
  onSignOut,
  children,
}: {
  personName: string;
  onSignOut: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

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
    return NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  const initials =
    personName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "CN";

  return (
    <div className={`canteen-scope ${outfit.variable} ${ibmPlexMono.variable}`} style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 266,
          flex: "0 0 266px",
          background: "var(--can-white)",
          borderRight: "1px solid var(--can-border)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div
          className="can-hover-lift"
          style={{ display: "flex", alignItems: "center", gap: 11, padding: "18px 18px 16px", borderBottom: "1px solid var(--can-divider)" }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--can-navy)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              font: "700 15px/1 var(--can-font-sans)",
            }}
          >
            PP
          </div>
          <div>
            <div style={{ font: "700 16px/1.1 var(--can-font-sans)", color: "var(--can-navy)" }}>Pavakie</div>
            <div style={{ font: "400 11.5px/1.3 var(--can-font-sans)", color: "var(--can-body-muted)", letterSpacing: ".02em" }}>
              Public School
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, overflow: "auto", padding: "16px 12px 8px" }}>
          <div style={{ font: "600 10.5px/1 var(--can-font-sans)", letterSpacing: ".1em", color: "var(--can-tertiary)", padding: "0 12px 9px" }}>
            OVERVIEW
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
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
                    padding: "9px 12px",
                    borderRadius: 9,
                    font: "500 14px/1.25 var(--can-font-sans)",
                    background: active ? "var(--can-tint)" : "transparent",
                    color: active ? "var(--can-primary)" : "var(--can-body)",
                  }}
                >
                  <NavIcon id={item.icon} stroke={active ? "var(--can-primary)" : "var(--can-body-muted)"} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <Link
          href="#"
          className="can-hover-lift"
          style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", padding: "14px 16px", border: 0, borderTop: "1px solid var(--can-divider)", background: "var(--can-white)" }}
        >
          <span
            style={{ width: 36, height: 36, flex: "0 0 36px", borderRadius: "50%", background: "var(--can-navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "600 13px/1 var(--can-font-sans)" }}
          >
            {initials}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", font: "600 14px/1.2 var(--can-font-sans)", color: "var(--can-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {personName}
            </span>
            <span style={{ display: "block", font: "400 12px/1.3 var(--can-font-sans)", color: "var(--can-body-muted)" }}>Canteen staff</span>
          </span>
          <form action={onSignOut} onClick={(e) => e.stopPropagation()}>
            <button
              type="submit"
              title="Sign out"
              style={{ width: 30, height: 30, border: "1px solid var(--can-border)", borderRadius: 8, background: "var(--can-white)", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <SignOutIcon />
            </button>
          </form>
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
            background: "var(--can-white)",
            borderBottom: "1px solid var(--can-border)",
          }}
        >
          <div ref={searchRef} style={{ flex: 1, maxWidth: 560, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--can-panel)", border: "1px solid var(--can-border)", borderRadius: 9, padding: "9px 12px" }}>
              <SearchIcon />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search Dashboard, Ledger, History…"
                style={{ flex: 1, minWidth: 0, border: 0, background: "none", font: "400 14px/1.2 var(--can-font-sans)", color: "var(--can-ink)" }}
              />
              {!query && (
                <span className="can-font-mono" style={{ font: "500 11px/1 var(--can-font-mono)", color: "var(--can-tertiary)", background: "var(--can-chip)", borderRadius: 5, padding: "3px 6px" }}>
                  Ctrl K
                </span>
              )}
              {searchOpen && (
                <button type="button" onClick={() => { setQuery(""); setSearchOpen(false); }} style={{ border: 0, background: "none", cursor: "pointer", color: "var(--can-body-muted)", padding: "0 2px" }}>
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
                  background: "var(--can-white)",
                  border: "1px solid var(--can-border)",
                  borderRadius: 12,
                  boxShadow: "var(--can-shadow-popover-strong)",
                  maxHeight: 440,
                  overflow: "auto",
                  padding: 8,
                }}
              >
                <div style={{ font: "600 10.5px/1 var(--can-font-sans)", letterSpacing: ".09em", color: "var(--can-tertiary)", padding: "8px 10px 10px" }}>
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
                    className="can-hover-lift flex w-full items-center text-left"
                    style={{ gap: 12, border: 0, background: "var(--can-white)", cursor: "pointer", borderRadius: 9, padding: 10 }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", font: "600 14.5px/1.3 var(--can-font-sans)", color: "var(--can-ink)" }}>{r.label}</span>
                    </span>
                    <span style={{ font: "600 11px/1 var(--can-font-sans)", letterSpacing: ".06em", color: "var(--can-primary)", background: "var(--can-tint)", borderRadius: 20, padding: "6px 10px" }}>
                      PAGE
                    </span>
                  </button>
                ))}
                {navResults.length === 0 && (
                  <div style={{ padding: "26px 12px", textAlign: "center", font: "400 14px/1.5 var(--can-font-sans)", color: "var(--can-tertiary)" }}>
                    No matches for that search.
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--can-divider)", borderRadius: 8, padding: "8px 14px", font: "500 13.5px/1 var(--can-font-sans)", color: "var(--can-navy)" }}>
            Canteen counter
          </div>
        </header>

        <main style={{ flex: 1, padding: "28px 26px 56px", maxWidth: 1480, width: "100%" }}>{children}</main>
      </div>
    </div>
  );
}
