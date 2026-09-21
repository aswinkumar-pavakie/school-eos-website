"use client";

// Pixel-rebuilt from the design's own sidebar+topbar shell (brain/Copy of
// Parent web login design/Parent Web Portal.dc.html) -- real linked
// children (guardian_link), real nav-active state from the real route,
// real sign-out. The design's own in-page child "switcher" becomes a real
// navigation (?studentId=...) so every other page picks up the same real
// child scope server-side, exactly like the rest of this app's
// child-selection convention.

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { NavIcon } from "./icons";
import { PARENT_NAV } from "./nav-items";
import { FlashProvider } from "./FlashContext";
import "../../app/(dashboard)/parent/parent-theme.css";
import { AskAiWidget, AI_CHAT_PANEL_WIDTH } from "../ai-chat/AskAiWidget";

export interface ParentChildOption {
  studentId: string;
  studentName: string;
  gradeName: string | null;
  sectionName: string | null;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/parent") return pathname === "/parent";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initialsOf(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

export function ParentShell({
  personName,
  childOptions,
  academicYearLabel,
  termLabel,
  homeworkPendingCount,
  feesOverdueCount,
  children,
}: {
  personName: string;
  childOptions: ParentChildOption[];
  academicYearLabel: string;
  termLabel: string;
  homeworkPendingCount: number;
  feesOverdueCount: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const requestedId = searchParams.get("studentId");
  const selectedChild = childOptions.find((c) => c.studentId === requestedId) ?? childOptions[0]!;

  function selectChild(studentId: string) {
    setSwitcherOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("studentId", studentId);
    router.push(url.pathname + url.search);
  }

  const classLabel = [selectedChild.gradeName, selectedChild.sectionName].filter(Boolean).join("-") || "—";

  return (
    <FlashProvider>
      <div
        className="parent-scope"
        style={{
          minHeight: "100vh",
          display: "flex",
          marginRight: aiChatOpen ? AI_CHAT_PANEL_WIDTH : 0,
          transition: "margin-right 300ms ease",
        }}
      >
        {/* Sidebar */}
        <div style={{ width: 248, flexShrink: 0, background: "#fff", borderRight: "1px solid var(--par-border)", display: "flex", flexDirection: "column", padding: "24px 16px", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 24px" }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: "var(--par-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>PP</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Pavakie</div>
              <div style={{ fontSize: 12, color: "var(--par-body-muted)" }}>Public School</div>
            </div>
          </div>

          <div onClick={() => setSwitcherOpen((o) => !o)} style={{ background: "var(--par-panel)", borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 10, marginBottom: 20, cursor: "pointer", flex: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--par-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              {initialsOf(selectedChild.studentName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedChild.studentName}</div>
              <div style={{ fontSize: 11, color: "var(--par-body-muted)" }}>{classLabel}</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--par-body-muted)" }}>▾</div>
          </div>

          {switcherOpen && childOptions.length > 1 && (
            <div style={{ margin: "-12px 0 20px", background: "#fff", border: "1px solid var(--par-border)", borderRadius: 14, overflow: "hidden", boxShadow: "0 6px 18px rgba(17,24,39,0.06)", flex: "none" }}>
              {childOptions.map((c, i) => (
                <div
                  key={c.studentId}
                  onClick={() => selectChild(c.studentId)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    cursor: "pointer",
                    background: c.studentId === selectedChild.studentId ? "var(--par-tint-strong)" : "#fff",
                    borderBottom: i < childOptions.length - 1 ? "1px solid #EDEFF5" : undefined,
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--par-tint-strong)", color: "var(--par-primary-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {initialsOf(c.studentName)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>{c.studentName}</div>
                    <div style={{ fontSize: 12, color: "#8A90A0", marginTop: 1 }}>{[c.gradeName, c.sectionName].filter(Boolean).join("-") || "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {PARENT_NAV.map((group) => (
            <div key={group.title}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9AA1B2", letterSpacing: "0.06em", textTransform: "uppercase", padding: "0 8px", margin: "16px 0 8px" }}>{group.title}</div>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const count = item.countKey === "homework" ? homeworkPendingCount : item.countKey === "fees" ? feesOverdueCount : 0;
                return (
                  <Link
                    key={item.id}
                    href={`${item.href}?studentId=${selectedChild.studentId}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: 9,
                      marginBottom: 2,
                      textDecoration: "none",
                      background: active ? "var(--par-tint)" : "transparent",
                      color: active ? "var(--par-primary)" : "#374151",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <NavIcon id={item.icon} style={{ color: active ? "var(--par-primary)" : "#5B6478" }} />
                      <span style={{ fontSize: 14, fontWeight: active ? 600 : 400 }}>{item.label}</span>
                    </div>
                    {count > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 700, background: active ? "#fff" : "var(--par-red)", color: active ? "var(--par-primary)" : "#fff", borderRadius: 20, padding: "1px 7px" }}>{count}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          <div style={{ flex: 1 }} />
          <Link href={`/parent/profile?studentId=${selectedChild.studentId}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 8px", borderTop: "1px solid var(--par-divider)", marginTop: 12, textDecoration: "none", color: "inherit" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--par-panel)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "var(--par-primary)" }}>
              {initialsOf(personName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{personName}</div>
              <div style={{ fontSize: 11, color: "var(--par-body-muted)" }}>Parent</div>
            </div>
            <div style={{ fontSize: 13, color: "#9AA1B2" }}>›</div>
          </Link>
        </div>

        {/* Main column */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ height: 68, flexShrink: 0, background: "#fff", borderBottom: "1px solid var(--par-border)", display: "flex", alignItems: "center", gap: 16, padding: "0 28px", position: "sticky", top: 0, zIndex: 5 }}>
            <div style={{ flex: 1, maxWidth: 420, position: "relative" }}>
              <input
                type="text"
                placeholder="Search students, notices, fees, page"
                style={{ width: "100%", boxSizing: "border-box", border: "1px solid var(--par-border)", background: "var(--par-panel-2)", borderRadius: 9, padding: "9px 60px 9px 34px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
              />
              <span style={{ position: "absolute", left: 12, top: 10, color: "var(--par-tertiary)", fontSize: 13 }}>🔍</span>
              <span style={{ position: "absolute", right: 10, top: 8, fontSize: 11, color: "var(--par-tertiary)", background: "var(--par-tint-strong)", borderRadius: 5, padding: "3px 6px", fontFamily: "monospace" }}>Ctrl K</span>
            </div>
            <div style={{ flex: 1 }} />
            <AskAiWidget onOpenChange={setAiChatOpen} />
            <div style={{ background: "var(--par-panel)", borderRadius: 9, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "var(--par-navy)" }}>Parent · {classLabel}</div>
            <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 9, padding: "9px 16px", fontSize: 14, fontWeight: 600, color: "var(--par-navy)" }}>{academicYearLabel}</div>
            {termLabel && <div style={{ background: "var(--par-navy)", color: "#fff", borderRadius: 9, padding: "9px 16px", fontSize: 14, fontWeight: 700 }}>{termLabel}</div>}
            <Link href={`/parent/messages?studentId=${selectedChild.studentId}`} style={{ textDecoration: "none" }}>
              <span style={{ display: "inline-block", background: "var(--par-primary)", color: "#fff", borderRadius: 9, padding: "11px 20px", fontSize: 14, fontWeight: 700 }}>Message teacher</span>
            </Link>
          </div>

          <div style={{ padding: 28, flex: 1, minWidth: 0, overflowX: "hidden" }}>{children}</div>
        </div>
      </div>
    </FlashProvider>
  );
}
