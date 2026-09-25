"use client";

// Chrome (navbar/sidebar/logout/profile row) delegates entirely to the one
// shared AppShell (src/components/shared-ui/AppShell.tsx) -- same exact
// markup/tokens as every other role, per the product owner's explicit
// instruction that the core UI must be identical across every role login,
// using Faculty's confirmed-correct chrome as the reference. Only Parent's
// own real data/behavior lives here: real linked children (guardian_link),
// real nav-active state, real homework/fees badge counts, the child
// switcher (a real ?studentId=... navigation, not a design-only toggle).

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { NavIcon } from "./icons";
import { PARENT_NAV } from "./nav-items";
import { FlashProvider } from "./FlashContext";
import "../../app/(dashboard)/parent/parent-theme.css";
import { AppShell, type AppShellNavGroup } from "../shared-ui/AppShell";

export interface ParentChildOption {
  studentId: string;
  studentName: string;
  gradeName: string | null;
  sectionName: string | null;
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
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const requestedId = searchParams.get("studentId");
  const selectedChild = childOptions.find((c) => c.studentId === requestedId) ?? childOptions[0]!;

  function selectChild(studentId: string) {
    setSwitcherOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("studentId", studentId);
    router.push(url.pathname + url.search);
  }

  const classLabel = [selectedChild.gradeName, selectedChild.sectionName].filter(Boolean).join("-") || "—";

  const navGroups: AppShellNavGroup[] = PARENT_NAV.map((group) => ({
    label: group.title,
    items: group.items.map((item) => ({
      href: `${item.href}?studentId=${selectedChild.studentId}`,
      label: item.label,
      icon: <NavIcon id={item.icon} style={{ color: "var(--par-tertiary-2)" }} />,
      activeIcon: <NavIcon id={item.icon} style={{ color: "var(--par-primary)" }} />,
      badge: item.countKey === "homework" ? homeworkPendingCount : item.countKey === "fees" ? feesOverdueCount : undefined,
    })),
  }));

  return (
    <FlashProvider>
      <div className="parent-scope">
        <AppShell
          rootHref="/parent"
          navGroups={navGroups}
          personName={personName}
          personRoleLabel={`Parent · ${classLabel}`}
          academicYear={academicYearLabel}
          termLabel={termLabel}
          searchPlaceholder="Search students, notices, fees, page"
          profileHref={`/parent/profile?studentId=${selectedChild.studentId}`}
          headerExtra={
            <Link href={`/parent/messages?studentId=${selectedChild.studentId}`} style={{ textDecoration: "none" }}>
              <span
                style={{
                  display: "inline-block",
                  background: "var(--par-primary)",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "10px 15px",
                  font: "600 13.5px/1 var(--par-font)",
                }}
              >
                Message teacher
              </span>
            </Link>
          }
          sidebarBeforeNav={
            <div style={{ marginBottom: 16 }}>
              <div
                onClick={() => setSwitcherOpen((o) => !o)}
                style={{
                  background: "var(--par-panel)",
                  borderRadius: 12,
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "var(--par-primary)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {initialsOf(selectedChild.studentName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {selectedChild.studentName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--par-body-muted)" }}>{classLabel}</div>
                </div>
                <div style={{ fontSize: 11, color: "var(--par-body-muted)" }}>▾</div>
              </div>

              {switcherOpen && childOptions.length > 1 && (
                <div
                  style={{
                    margin: "4px 0 0",
                    background: "#fff",
                    border: "1px solid var(--par-border)",
                    borderRadius: 14,
                    overflow: "hidden",
                    boxShadow: "0 6px 18px rgba(17,24,39,0.06)",
                  }}
                >
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
                        borderBottom: i < childOptions.length - 1 ? "1px solid var(--par-divider)" : undefined,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--par-tint-strong)",
                          color: "var(--par-primary-strong)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 13,
                          flexShrink: 0,
                        }}
                      >
                        {initialsOf(c.studentName)}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--par-ink)" }}>{c.studentName}</div>
                        <div style={{ fontSize: 12, color: "var(--par-tertiary-2)", marginTop: 1 }}>
                          {[c.gradeName, c.sectionName].filter(Boolean).join("-") || "—"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          }
        >
          {children}
        </AppShell>
      </div>
    </FlashProvider>
  );
}
