"use client";

// Chrome (navbar/sidebar/logout/profile row) delegates entirely to the one
// shared AppShell (src/components/shared-ui/AppShell.tsx) -- identical markup
// to every other role's login, per the product owner's explicit instruction.
// Only this role's own real behavior lives here: its nav items + pending
// badge, the Boys/Girls wing toggle and URL-driven ?q= search every page
// reads, the "students out now" bell, the per-screen page title, sign-out.

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { Outfit } from "next/font/google";
import { BellIcon, NavIcon, SearchIcon } from "./icons";
import { HOSTEL_WARDEN_NAV, HOSTEL_WARDEN_TITLES } from "./nav-items";
import { FlashProvider } from "./FlashContext";
import { AppShell, type AppShellNavGroup } from "../shared-ui/AppShell";
import "../../app/(dashboard)/hostel-warden/hostel-warden-theme.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
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
  const [title] = HOSTEL_WARDEN_TITLES[activeId] ?? HOSTEL_WARDEN_TITLES.dashboard;

  const wing: "Boys" | "Girls" = searchParams.get("wing") === "Girls" ? "Girls" : "Boys";
  // Driven straight from the URL (no local mirror state) -- searchParams is
  // the single source of truth for both the wing and the search text.
  const query = searchParams.get("q") ?? "";

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.length > 0) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const hasPending = typeof pendingApprovalsCount === "number" && pendingApprovalsCount > 0;

  const navGroups: AppShellNavGroup[] = HOSTEL_WARDEN_NAV.map((g) => ({
    label: g.label.toUpperCase(),
    items: g.items.map((item) => ({
      href: item.href,
      label: item.label,
      icon: <NavIcon id={item.id} stroke="var(--color-text-muted)" />,
      activeIcon: <NavIcon id={item.id} stroke="var(--color-primary)" />,
      badge: item.id === "approvals" && hasPending ? pendingApprovalsCount : undefined,
    })),
  }));

  return (
    <FlashProvider>
      <div className={`hostel-warden-scope ${outfit.variable}`}>
        <AppShell
          rootHref="/hostel-warden"
          schoolSubtitle="Public School · Hostels"
          navGroups={navGroups}
          personName={personName}
          personRoleLabel={roleLabel}
          profileHref="/hostel-warden/profile"
          customSearch={
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid var(--color-border)",
                background: "var(--color-field)",
                borderRadius: 9,
                padding: "0 12px",
                height: 40,
                flex: "1 1 200px",
                minWidth: 0,
                maxWidth: 560,
              }}
            >
              <SearchIcon />
              <input
                value={query}
                onChange={(e) => updateParam("q", e.target.value)}
                placeholder="Search by name, admission number or room"
                aria-label="Search"
                style={{ all: "unset", flex: 1, minWidth: 0, fontFamily: "inherit", fontSize: 14, color: "var(--color-text)" }}
              />
              {!query && (
                <span style={{ font: "500 11px/1 var(--font-mono)", color: "var(--color-text-tertiary)", background: "var(--color-hover-fill)", borderRadius: 5, padding: "3px 6px" }}>
                  Ctrl K
                </span>
              )}
            </label>
          }
          headerExtra={
            <>
              <div
                role="group"
                aria-label="Hostel wing"
                style={{ display: "flex", alignItems: "center", gap: 4, border: "1px solid var(--color-border)", borderRadius: 9, padding: 3 }}
              >
                {(["Boys", "Girls"] as const).map((w) => {
                  const active = wing === w;
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => updateParam("wing", w === "Boys" ? null : w)}
                      style={{
                        all: "unset",
                        cursor: "pointer",
                        padding: "6px 14px",
                        borderRadius: 7,
                        fontSize: 12.5,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        background: active ? "var(--color-primary)" : "transparent",
                        color: active ? "#fff" : "var(--color-text-muted)",
                      }}
                    >
                      {w} hostel
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => router.push("/hostel-warden/movement-log")}
                aria-label="Students out of the hostel now"
                style={{
                  all: "unset",
                  cursor: "pointer",
                  position: "relative",
                  width: 40,
                  height: 40,
                  flex: "0 0 40px",
                  border: "1px solid var(--color-border)",
                  borderRadius: 9,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <BellIcon />
                {hasPending && (
                  <span
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      minWidth: 17,
                      height: 17,
                      borderRadius: 20,
                      background: "var(--color-primary)",
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
            </>
          }
        >
          <h1 style={{ margin: "0 0 20px", fontWeight: 800, fontSize: 27, letterSpacing: "-0.03em", lineHeight: 1.15 }}>{title}</h1>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>{children}</div>
        </AppShell>
      </div>
    </FlashProvider>
  );
}
