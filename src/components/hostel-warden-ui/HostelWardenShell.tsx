"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BellIcon, ChevronRightIcon, NavIcon, SearchIcon } from "./icons";
import { HOSTEL_WARDEN_NAV, HOSTEL_WARDEN_TITLES } from "./nav-items";
import { FlashProvider } from "./FlashContext";
import "../../app/(dashboard)/hostel-warden/hostel-warden-theme.css";
import { AskAiWidget, AI_CHAT_PANEL_WIDTH } from "../ai-chat/AskAiWidget";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans-hw",
});

function isActive(pathname: string, href: string): boolean {
  if (href === "/hostel-warden") return pathname === "/hostel-warden";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function findActiveId(pathname: string): string {
  let best: { id: string; href: string } | null = null;
  for (const g of HOSTEL_WARDEN_NAV) {
    for (const item of g.items) {
      if (!isActive(pathname, item.href)) continue;
      if (best === null || item.href.length > best.href.length) best = { id: item.id, href: item.href };
    }
  }
  return best?.id ?? "dashboard";
}

export interface HostelWardenWing {
  value: "Boys" | "Girls";
}

export function HostelWardenShell({
  personName,
  roleLabel = "Hostel warden",
  pendingApprovalsCount,
  onSignOut,
  children,
}: {
  personName: string;
  roleLabel?: string;
  /** Real count of pending gate-pass/emergency-exit requests awaiting this warden's decision. Omit while unknown -- the badge only renders once a real number is available, never a placeholder zero. */
  pendingApprovalsCount?: number;
  onSignOut: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = useMemo(() => findActiveId(pathname), [pathname]);
  const [title, subtitle] = HOSTEL_WARDEN_TITLES[activeId] ?? HOSTEL_WARDEN_TITLES.dashboard;

  const wing: "Boys" | "Girls" = searchParams.get("wing") === "Girls" ? "Girls" : "Boys";
  // Driven straight from the URL (no local mirror state) -- searchParams is
  // already the single source of truth, and updateParam below keeps it in
  // sync on every keystroke, so a second copy of "query" would just be state
  // that needs re-syncing whenever the URL changes some other way (back/
  // forward navigation, another control on the page).
  const query = searchParams.get("q") ?? "";

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.length > 0) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const [profileOpen, setProfileOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!profileOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileOpen]);

  const initials =
    personName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "HW";

  return (
    <FlashProvider>
      <div
        className={`hostel-warden-scope ${plusJakartaSans.variable}`}
        style={{
          display: "flex",
          minHeight: "100vh",
          marginRight: aiChatOpen ? AI_CHAT_PANEL_WIDTH : 0,
          transition: "margin-right 300ms ease",
        }}
      >
        <aside
          style={{
            width: 272,
            flex: "0 0 272px",
            borderRight: "1px solid var(--hw-divider)",
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: 0,
            height: "100vh",
            background: "var(--hw-surface)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 20px" }}>
            <span
              style={{
                width: 44,
                height: 44,
                flex: "0 0 44px",
                borderRadius: 13,
                background: "var(--hw-accent-900)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: "0.01em",
              }}
            >
              PP
            </span>
            <span style={{ minWidth: 0, textAlign: "left" }}>
              <span style={{ display: "block", fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", lineHeight: 1.15, whiteSpace: "nowrap", color: "var(--hw-text)" }}>
                Pavakie
              </span>
              <span style={{ display: "block", fontSize: 12.5, color: "var(--hw-text-muted)", marginTop: 1 }}>
                Public School · Hostels
              </span>
            </span>
          </div>

          <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {HOSTEL_WARDEN_NAV.map((g) => (
              <div key={g.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--hw-text-faint)", padding: "6px 12px 8px" }}>
                  {g.label}
                </div>
                {g.items.map((item) => {
                  const active = item.id === activeId;
                  const showBadge = item.id === "approvals" && typeof pendingApprovalsCount === "number" && pendingApprovalsCount > 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="hw-surface-hover"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 500,
                        background: active ? "var(--hw-accent-100)" : "transparent",
                        color: active ? "var(--hw-accent-900)" : "#3d4754",
                      }}
                    >
                      <NavIcon id={item.id} stroke={active ? "var(--hw-accent)" : "#6b7580"} />
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                      {showBadge && (
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--hw-text-faint)", fontVariantNumeric: "tabular-nums" }}>
                          {pendingApprovalsCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div ref={profileRef} style={{ position: "relative", borderTop: "1px solid var(--hw-divider)" }}>
            {profileOpen && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 16,
                  right: 16,
                  marginBottom: 8,
                  background: "var(--hw-surface)",
                  border: "1px solid var(--hw-divider)",
                  borderRadius: "var(--hw-radius-md)",
                  boxShadow: "0 18px 40px rgba(15,23,42,.12)",
                  overflow: "hidden",
                  zIndex: 20,
                }}
              >
                <form action={onSignOut}>
                  <button
                    type="submit"
                    className="hw-surface-hover"
                    style={{ all: "unset", cursor: "pointer", display: "block", width: "100%", boxSizing: "border-box", padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "var(--hw-red-strong)" }}
                  >
                    Sign out
                  </button>
                </form>
              </div>
            )}
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              className="hw-surface-hover"
              style={{ all: "unset", cursor: "pointer", display: "flex", width: "100%", boxSizing: "border-box", alignItems: "center", gap: 11, padding: "14px 16px" }}
            >
              <span style={{ width: 38, height: 38, flex: "0 0 38px", borderRadius: "50%", background: "var(--hw-accent-900)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13 }}>
                {initials}
              </span>
              <span style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {personName}
                </span>
                <span style={{ display: "block", fontSize: 12, color: "var(--hw-text-muted)", marginTop: 1 }}>{roleLabel}</span>
              </span>
              <ChevronRightIcon />
            </button>
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--hw-bg)" }}>
          <header
            style={{
              minHeight: 70,
              borderBottom: "1px solid var(--hw-divider)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              padding: "14px 32px",
              position: "sticky",
              top: 0,
              background: "var(--hw-surface)",
              zIndex: 5,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontWeight: 800, fontSize: 27, letterSpacing: "-0.03em", lineHeight: 1.15 }}>{title}</h1>
            </div>
            <div style={{ flex: 1 }} />
            <AskAiWidget onOpenChange={setAiChatOpen} />

            <div role="group" aria-label="Hostel wing" style={{ display: "flex", alignItems: "center", gap: 4, border: "1px solid var(--hw-divider)", borderRadius: 9, padding: 3 }}>
              {(["Boys", "Girls"] as const).map((w) => {
                const active = wing === w;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => updateParam("wing", w === "Boys" ? null : w)}
                    className={active ? undefined : "hw-btn-ghost"}
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      padding: "6px 14px",
                      borderRadius: 7,
                      fontSize: 12.5,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      background: active ? "var(--hw-accent)" : "transparent",
                      color: active ? "#fff" : "var(--hw-text-muted)",
                    }}
                  >
                    {w} hostel
                  </button>
                );
              })}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--hw-divider)", borderRadius: 9, padding: "0 12px", height: 40, flex: "1 1 200px", minWidth: 0, maxWidth: 340 }}>
              <SearchIcon />
              <input
                value={query}
                onChange={(e) => updateParam("q", e.target.value)}
                placeholder="Search by name, admission number or room"
                aria-label="Search"
                style={{ all: "unset", flex: 1, minWidth: 0, fontFamily: "inherit", fontSize: 13, color: "var(--hw-text)" }}
              />
            </label>

            <button
              type="button"
              onClick={() => router.push("/hostel-warden/movement-log")}
              aria-label="Students out of the hostel now"
              className="hw-surface-hover"
              style={{ all: "unset", cursor: "pointer", position: "relative", width: 40, height: 40, flex: "0 0 40px", border: "1px solid var(--hw-divider)", borderRadius: 9, display: "grid", placeItems: "center" }}
            >
              <BellIcon />
              {typeof pendingApprovalsCount === "number" && pendingApprovalsCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    minWidth: 17,
                    height: 17,
                    borderRadius: 20,
                    background: "var(--hw-accent)",
                    color: "#fff",
                    fontSize: 10.5,
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                    padding: "0 4px",
                  }}
                >
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          </header>

          <div style={{ padding: "30px 32px 60px", display: "flex", flexDirection: "column", gap: 24 }}>{children}</div>
        </main>
      </div>
    </FlashProvider>
  );
}
