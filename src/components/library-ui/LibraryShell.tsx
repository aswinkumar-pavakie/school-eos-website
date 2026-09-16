"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { NavIcon, SearchIcon, CampusIcon, SettingsGearIcon, BellIcon, SignOutIcon } from "./icons";
import { LIBRARY_NAV_GROUPS } from "./nav-items";
import { ToastProvider } from "./toast/ToastProvider";
import "../../app/(dashboard)/library/library-theme.css";

// Fonts are loaded only inside this route group -- other roles' bundles never
// pay for them. See library-theme.css's own comment for the full token
// scoping strategy. Variable names are deliberately distinct from the
// Faculty rebuild's --font-outfit/--font-ibm-plex-mono (this is a second,
// independent Outfit load + a different mono face).
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit-lib",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

function isActive(pathname: string, href: string): boolean {
  if (href === "/library") return pathname === "/library";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function findActiveHref(pathname: string): string | null {
  let best: string | null = null;
  for (const g of LIBRARY_NAV_GROUPS) {
    for (const item of g.items) {
      if (!isActive(pathname, item.href)) continue;
      if (best === null || item.href.length > best.length) best = item.href;
    }
  }
  return best;
}

export function LibraryShell({
  personName,
  academicYear,
  onSignOut,
  children,
}: {
  personName: string;
  academicYear: string;
  onSignOut: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeHref = useMemo(() => findActiveHref(pathname), [pathname]);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        searchRef.current?.querySelector("input")?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Baseline "jump to a page" search: nav pages only, client-side substring
  // match -- matches the design's own placeholder text exactly and needs no
  // backend dependency.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const hits: { title: string; sub: string; href: string }[] = [];
    for (const g of LIBRARY_NAV_GROUPS) {
      for (const item of g.items) {
        if (item.label.toLowerCase().includes(q)) hits.push({ title: item.label, sub: g.label, href: item.href });
      }
    }
    return hits;
  }, [query]);

  const initials =
    personName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "LI";

  return (
    <ToastProvider>
    <div className={`library-scope ${outfit.variable} ${jetbrainsMono.variable}`} style={{ display: "grid", gridTemplateColumns: "296px minmax(0,1fr)", minHeight: "100vh", alignItems: "start" }}>
      <aside
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--lib-border)",
          background: "var(--lib-white)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "20px 22px", borderBottom: "1px solid var(--lib-divider)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: "var(--lib-navy)", display: "grid", placeItems: "center", color: "#fff", font: "600 15px/1 var(--lib-font-sans)" }}>
            PP
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
            <div style={{ font: "600 17px/1.15 var(--lib-font-sans)", color: "var(--lib-ink)" }}>Pavakie Public School</div>
            <div style={{ font: "400 12px/1.15 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Library · Classes 1–12</div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: "16px 14px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          {LIBRARY_NAV_GROUPS.map((g) => (
            <div key={g.label}>
              <div style={{ font: "600 11px/1.2 var(--lib-font-sans)", letterSpacing: ".1em", color: "var(--lib-tertiary)", textTransform: "uppercase", padding: "8px 10px 6px" }}>
                {g.label}
              </div>
              {g.items.map((item) => {
                const active = item.href === activeHref;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      width: "100%",
                      padding: "11px 12px",
                      border: 0,
                      borderRadius: 9,
                      textAlign: "left",
                      font: "500 15px/1.2 var(--lib-font-sans)",
                      background: active ? "var(--lib-tint)" : "transparent",
                      color: active ? "var(--lib-primary)" : "var(--lib-body)",
                    }}
                  >
                    <NavIcon id={item.icon} stroke={active ? "var(--lib-primary)" : "currentColor"} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "16px 18px", borderTop: "1px solid var(--lib-divider)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 999, background: "var(--lib-ink)", display: "grid", placeItems: "center", color: "#fff", font: "600 13px/1 var(--lib-font-sans)" }}>
            {initials}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0, flex: 1 }}>
            <div style={{ font: "500 14px/1.2 var(--lib-font-sans)", color: "var(--lib-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {personName}
            </div>
            <div style={{ font: "400 12px/1.2 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Librarian</div>
          </div>
          <form action={onSignOut}>
            <button
              type="submit"
              title="Sign out"
              className="lib-surface-hover"
              style={{ width: 34, height: 34, border: "1px solid var(--lib-border)", borderRadius: 9, background: "var(--lib-white)", color: "#475569", cursor: "pointer", display: "grid", placeItems: "center" }}
            >
              <SignOutIcon />
            </button>
          </form>
        </div>
      </aside>

      <main style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 5, display: "flex", alignItems: "center", gap: 16, padding: "14px 32px", background: "var(--lib-white)", borderBottom: "1px solid var(--lib-divider)" }}>
          <div ref={searchRef} style={{ flex: 1, maxWidth: 820, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 11, background: "var(--lib-panel)" }}>
              <SearchIcon stroke="#64748B" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Jump to a page — books, issue, reports…"
                style={{ flex: 1, border: 0, background: "transparent", outline: "none", font: "400 15px/1.2 var(--lib-font-sans)", color: "var(--lib-ink)" }}
              />
            </div>
            {open && query.trim() && (
              <div
                style={{
                  position: "absolute",
                  top: 54,
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: "var(--lib-white)",
                  border: "1px solid var(--lib-border)",
                  borderRadius: 12,
                  boxShadow: "0 18px 40px rgba(15,23,42,.12)",
                  maxHeight: 420,
                  overflow: "auto",
                  padding: 8,
                }}
              >
                {results.length === 0 && (
                  <div style={{ padding: "22px 12px", textAlign: "center", font: "400 14px/1.5 var(--lib-font-sans)", color: "var(--lib-tertiary)" }}>
                    No matches for that search.
                  </div>
                )}
                {results.map((r) => (
                  <button
                    key={r.href}
                    type="button"
                    onClick={() => {
                      router.push(r.href);
                      setQuery("");
                      setOpen(false);
                    }}
                    className="lib-surface-hover flex w-full items-center text-left"
                    style={{ gap: 12, border: 0, background: "var(--lib-white)", cursor: "pointer", borderRadius: 9, padding: 10 }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", font: "500 14.5px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{r.title}</span>
                      <span style={{ display: "block", font: "400 12.5px/1.4 var(--lib-font-sans)", color: "var(--lib-tertiary)" }}>{r.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 18px", border: "1px solid var(--lib-border)", borderRadius: 999, font: "500 15px/1.2 var(--lib-font-sans)", color: "var(--lib-ink)" }}>
              <CampusIcon />
              Library · Campus
            </div>
            <div style={{ padding: "9px 14px", border: "1px solid var(--lib-border)", borderRadius: 10, font: "500 14px/1.2 var(--lib-font-mono)", color: "#475569" }}>
              {academicYear}
            </div>
            <button type="button" className="lib-surface-hover" style={{ width: 40, height: 40, border: "1px solid var(--lib-border)", borderRadius: 10, background: "var(--lib-white)", color: "#475569", cursor: "pointer", display: "grid", placeItems: "center" }}>
              <SettingsGearIcon />
            </button>
            <button type="button" className="lib-surface-hover" style={{ position: "relative", width: 40, height: 40, border: "1px solid var(--lib-border)", borderRadius: 10, background: "var(--lib-white)", color: "#475569", cursor: "pointer", display: "grid", placeItems: "center" }}>
              <BellIcon />
            </button>
          </div>
        </div>

        <div style={{ padding: "36px 32px 72px", display: "flex", flexDirection: "column", gap: 28 }}>{children}</div>
      </main>
    </div>
    </ToastProvider>
  );
}
