"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BellIcon, SearchIcon } from "./icons";
import { MEDIA_NAV } from "./nav-items";
import { FlashProvider } from "./FlashContext";
import "../../app/(dashboard)/media/media-theme.css";

export function MediaShell({
  personName,
  personEmail,
  academicYearLabel,
  inventoryCount,
  indentCount,
  onSignOut,
  children,
}: {
  personName: string;
  personEmail: string;
  academicYearLabel: string;
  inventoryCount: number;
  indentCount: number;
  onSignOut: () => void | Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const initials = personName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "ME";

  const counts: Record<string, number> = { inventory: inventoryCount, indent: indentCount };

  return (
    <FlashProvider>
      <div className="media-scope" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <div style={{ height: 76, flex: "none", background: "#fff", borderBottom: "1px solid var(--med-border)", display: "flex", alignItems: "center", gap: 14, padding: "0 22px", minWidth: 0, overflowX: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: "0 1 230px" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--med-navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, letterSpacing: 0.5, flexShrink: 0 }}>PPS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Pavakie Public School</div>
              <div style={{ fontSize: 12, color: "var(--med-body-muted)", fontWeight: 500 }}>Media Room</div>
            </div>
          </div>
          <div style={{ flex: "1 1 200px", minWidth: 120, maxWidth: 520, height: 44, borderRadius: 11, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: "#fff", border: "1px solid var(--med-border)" }}>
            <SearchIcon />
            <input placeholder="Search shoots, indents, equipment..." style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 14, color: "var(--med-ink)", background: "transparent", fontFamily: "inherit" }} />
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--med-border)", borderRadius: 20, height: 42, padding: "0 16px", flexShrink: 0 }}>
            <span style={{ fontSize: 15 }}>🎓</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-ink)", whiteSpace: "nowrap" }}>Media room head</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", height: 42, border: "1px solid var(--med-border)", borderRadius: 20, padding: "0 16px", flexShrink: 0 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--med-ink)", whiteSpace: "nowrap" }}>{academicYearLabel}</span>
          </div>
          <span style={{ background: "var(--med-navy)", color: "#fff", fontSize: 13.5, fontWeight: 700, padding: "0 18px", height: 42, display: "flex", alignItems: "center", borderRadius: 20, flexShrink: 0, whiteSpace: "nowrap" }}>Odd Semester</span>
          <button type="button" className="media-btn-hover-ghost" style={{ width: 42, height: 42, borderRadius: "50%", border: "1px solid var(--med-border)", background: "#fff", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BellIcon />
          </button>
        </div>

        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <div style={{ width: 266, flex: "none", background: "#fff", borderRight: "1px solid var(--med-border)", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 14px 8px 14px" }}>
              {MEDIA_NAV.map((group) => (
                <div key={group.title}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 10px 10px 10px" }}>
                    <span style={{ fontSize: 11, letterSpacing: "1.4px", fontWeight: 700, color: "var(--med-tertiary-2)" }}>{group.title.toUpperCase()}</span>
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
                            padding: "11px 12px",
                            borderRadius: 10,
                            fontSize: 14.5,
                            fontWeight: active ? 700 : 600,
                            color: active ? "var(--med-primary)" : "var(--med-ink)",
                            background: active ? "var(--med-tint)" : "transparent",
                            textDecoration: "none",
                          }}
                        >
                          <item.Icon style={{ flexShrink: 0 }} />
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {count !== undefined && count > 0 && (
                            <span style={{ fontFamily: "var(--med-mono)", fontSize: 11.5, background: active ? "#fff" : "var(--med-panel)", color: "var(--med-body)", borderRadius: 6, padding: "2px 7px" }}>{count}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ flex: "none", borderTop: "1px solid var(--med-border)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--med-navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initials}</div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{personEmail || personName}</div>
                <div style={{ fontSize: 12, color: "var(--med-body-muted)" }}>Media room</div>
              </div>
              <form action={onSignOut}>
                <button type="submit" aria-label="Sign out" style={{ all: "unset", cursor: "pointer", color: "var(--med-tertiary-2)", fontSize: 16 }}>⇥</button>
              </form>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "34px 40px 60px 40px", background: "#fff" }}>{children}</div>
        </div>
      </div>
    </FlashProvider>
  );
}
