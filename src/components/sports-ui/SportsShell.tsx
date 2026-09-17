"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BellIcon, SearchIcon } from "./icons";
import { SPORTS_NAV } from "./nav-items";
import { FlashProvider } from "./FlashContext";
import "../../app/(dashboard)/sports-admin/sports-theme.css";

export function SportsShell({
  personName,
  academicYearLabel,
  odCount,
  indentsCount,
  unreadMessagesCount,
  onSignOut,
  children,
}: {
  personName: string;
  academicYearLabel: string;
  odCount: number;
  indentsCount: number;
  unreadMessagesCount: number;
  onSignOut: () => void | Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const initials = personName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "SA";

  const counts: Record<string, number> = { od: odCount, indents: indentsCount };

  return (
    <FlashProvider>
      <div className="sports-scope" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div style={{ height: 76, flex: "none", background: "#fff", borderBottom: "1px solid var(--sport-border-soft)", display: "flex", alignItems: "center", gap: 14, padding: "0 22px", minWidth: 0, overflowX: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: "0 1 230px" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--sport-navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, flexShrink: 0 }}>PPS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--sport-heading)" }}>Pavakie Public School</div>
              <div style={{ fontSize: 12, color: "var(--sport-body-muted)", fontWeight: 500 }}>Sports department</div>
            </div>
          </div>
          <div style={{ flex: "1 1 200px", minWidth: 120, maxWidth: 520, height: 44, borderRadius: 11, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: "#fff", border: "1px solid var(--sport-input-border)" }}>
            <SearchIcon style={{ color: "var(--sport-tertiary-2)" }} />
            <input placeholder="Search players, squads, fixtures, kit..." style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 14, color: "var(--sport-ink)", background: "transparent", fontFamily: "inherit" }} />
            <span style={{ fontFamily: "var(--sport-mono)", fontSize: 11, color: "var(--sport-tertiary-3)", background: "var(--sport-panel)", borderRadius: 6, padding: "3px 7px" }}>Ctrl K</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--sport-border)", borderRadius: 20, height: 42, padding: "0 16px", flexShrink: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--sport-ink)", whiteSpace: "nowrap" }}>Sports admin · School</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", height: 42, border: "1px solid var(--sport-border)", borderRadius: 20, padding: "0 16px", flexShrink: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--sport-ink)", whiteSpace: "nowrap" }}>{academicYearLabel}</span>
          </div>
          <span style={{ background: "var(--sport-navy)", color: "#fff", fontSize: 13.5, fontWeight: 700, padding: "0 18px", height: 42, display: "flex", alignItems: "center", borderRadius: 20, flexShrink: 0, whiteSpace: "nowrap" }}>Term I</span>
          <button
            type="button"
            className="sport-btn-hover-ghost"
            onClick={() => router.push("/sports-admin/messages")}
            style={{ position: "relative", width: 42, height: 42, borderRadius: "50%", border: "1px solid var(--sport-border)", background: "#fff", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <BellIcon style={{ color: "var(--sport-ink)" }} />
            {unreadMessagesCount > 0 ? (
              <span style={{ position: "absolute", top: -3, right: -3, background: "var(--sport-red)", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 999, minWidth: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
              </span>
            ) : null}
          </button>
        </div>

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <div style={{ width: 268, flex: "none", background: "#fff", borderRight: "1px solid var(--sport-border)", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 14px 8px 14px" }}>
              {SPORTS_NAV.map((group) => (
                <div key={group.title}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 10px 10px 10px" }}>
                    <span style={{ fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 700, color: "var(--sport-tertiary-3)" }}>{group.title.toUpperCase()}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {group.items.map((item) => {
                      const active = pathname === item.href;
                      const count = item.countKey ? counts[item.countKey] : undefined;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 12px",
                            borderRadius: 11,
                            fontSize: 14,
                            fontWeight: active ? 700 : 600,
                            color: active ? "var(--sport-primary)" : "var(--sport-ink)",
                            background: active ? "var(--sport-tint)" : "transparent",
                            textDecoration: "none",
                          }}
                        >
                          <item.Icon style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {count !== undefined && count > 0 && (
                            <span style={{ fontFamily: "var(--sport-mono)", fontSize: 11.5, background: active ? "#fff" : "var(--sport-panel)", color: "var(--sport-body)", borderRadius: 6, padding: "2px 7px" }}>{count}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ flex: "none", borderTop: "1px solid var(--sport-border)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--sport-navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initials}</div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--sport-ink)" }}>{personName}</div>
                <div style={{ fontSize: 12, color: "var(--sport-body-muted)" }}>Sports admin</div>
              </div>
              <form action={onSignOut}>
                <button type="submit" aria-label="Sign out" style={{ all: "unset", cursor: "pointer", color: "var(--sport-tertiary-3)", fontSize: 16 }}>⇥</button>
              </form>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "34px 30px 60px", background: "#fff" }}>{children}</div>
        </div>
      </div>
    </FlashProvider>
  );
}
