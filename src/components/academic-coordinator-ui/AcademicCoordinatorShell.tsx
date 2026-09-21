"use client";

// A genuinely separate portal from /faculty, not a nav item inside it -- per
// the product decision: an account that is both FACULTY and
// ACADEMIC_COORDINATOR (a real, distinct role_assignment scoped by
// scope_stage -- see nav-items.ts's own comment) keeps using /faculty for
// its own classes, and reaches this portal separately for stage-wide
// co-ordination duties. Faculty's own sidebar still links here (see
// faculty-ui/nav-items.ts's "Academic Coordinator" item), replacing the
// older, plainer /faculty/coordinator/* pages as the pixel-perfect
// destination -- those pages and their lib (faculty-coordinator-api.ts,
// fully reused here, not duplicated) stay in place, just no longer linked
// from nav.

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { NavIcon } from "./icons";
import { ACADEMIC_COORDINATOR_NAV } from "./nav-items";
import { FlashProvider } from "./FlashContext";
import { AskAiWidget, AI_CHAT_PANEL_WIDTH } from "../ai-chat/AskAiWidget";
import "../../app/(dashboard)/academic-coordinator/academic-coordinator-theme.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken-grotesk",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono-acc",
});

function isActive(pathname: string, href: string): boolean {
  if (href === "/academic-coordinator") return pathname === "/academic-coordinator";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function findActiveId(pathname: string): string {
  let best: { id: string; href: string } | null = null;
  for (const g of ACADEMIC_COORDINATOR_NAV) {
    for (const item of g.items) {
      if (!isActive(pathname, item.href)) continue;
      if (best === null || item.href.length > best.href.length) best = { id: item.id, href: item.href };
    }
  }
  return best?.id ?? "dashboard";
}

// "PRIMARY" -> "Grades 1–5 · Primary" etc -- real scope_stage values (see
// nav-items.ts comment) mapped to the design's own display convention. Grade
// numbers come from the real per-stage grade list (coordinatorMe.grades),
// not hardcoded, since a school's own grade-to-stage mapping can differ.
const STAGE_LABEL: Record<string, string> = {
  PRE_PRIMARY: "Pre-primary",
  PRIMARY: "Primary",
  MIDDLE: "Middle",
  SECONDARY: "Secondary",
  HIGHER_SECONDARY: "Higher secondary",
};

export interface StageOption {
  value: string;
  gradeRangeLabel: string;
}

export function AcademicCoordinatorShell({
  personName,
  stageOptions,
  hasFacultyAccess,
  onSignOut,
  children,
}: {
  personName: string;
  /** Real stage(s) this coordinator is actually scoped to (from
   * getCoordinatorMe()) -- never other coordinators' scopes. Usually one. */
  stageOptions: StageOption[];
  /** False for a genuinely separate coordinator-only login (no FACULTY
   * role_code at all) -- that account has nowhere to go in /faculty, so the
   * profile menu's "Go to Faculty console" link is hidden rather than
   * offering a dead end. */
  hasFacultyAccess: boolean;
  onSignOut: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = useMemo(() => findActiveId(pathname), [pathname]);

  const currentStage = searchParams.get("stage") && stageOptions.some((o) => o.value === searchParams.get("stage"))
    ? (searchParams.get("stage") as string)
    : (stageOptions[0]?.value ?? "");

  function setStage(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("stage", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
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
      .join("") || "AC";

  return (
    <FlashProvider>
    <div
      className={`academic-coordinator-scope ${hankenGrotesk.variable} ${ibmPlexMono.variable}`}
      style={{
        display: "flex",
        alignItems: "flex-start",
        minHeight: "100vh",
        marginRight: aiChatOpen ? AI_CHAT_PANEL_WIDTH : 0,
        transition: "margin-right 300ms ease",
      }}
    >
      <div style={{ width: 264, flex: "0 0 264px", background: "var(--acc-surface)", borderRight: "1px solid var(--acc-border)", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "17px 18px", borderBottom: "1px solid var(--acc-divider)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--acc-navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, letterSpacing: "0.03em" }}>
            PPS
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "var(--acc-navy)", fontSize: 14.5, lineHeight: 1.2 }}>Pavakie Public School</div>
            <div style={{ fontSize: 11.5, color: "var(--acc-body-muted)", marginTop: 2 }}>Academic co-ordination</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px 18px" }}>
          {ACADEMIC_COORDINATOR_NAV.map((g) => (
            <div key={g.title}>
              <div style={{ padding: "14px 10px 7px", fontSize: 10.5, letterSpacing: "0.1em", color: "var(--acc-tertiary)", fontWeight: 700 }}>{g.title}</div>
              {g.items.map((item) => {
                const active = item.id === activeId;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      padding: "9px 12px",
                      borderRadius: 10,
                      marginBottom: 2,
                      fontSize: 14.5,
                      lineHeight: 1.3,
                      background: active ? "var(--acc-accent-tint)" : "transparent",
                      color: active ? "var(--acc-accent)" : "#334155",
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    <NavIcon id={item.id} stroke={active ? "var(--acc-accent)" : "#334155"} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div ref={profileRef} style={{ position: "relative", borderTop: "1px solid var(--acc-divider)" }}>
          {profileOpen && (
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: 16,
                right: 16,
                marginBottom: 8,
                background: "var(--acc-surface)",
                border: "1px solid var(--acc-border)",
                borderRadius: "var(--acc-radius-card)",
                boxShadow: "0 18px 40px rgba(15,23,42,.12)",
                overflow: "hidden",
                zIndex: 20,
              }}
            >
              {hasFacultyAccess && (
                <Link href="/faculty" style={{ display: "block", padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "var(--acc-navy)", borderBottom: "1px solid var(--acc-divider)" }}>
                  Go to Faculty console
                </Link>
              )}
              <form action={onSignOut}>
                <LogoutButton />
              </form>
            </div>
          )}
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            style={{ all: "unset", cursor: "pointer", display: "flex", width: "100%", boxSizing: "border-box", alignItems: "center", gap: 11, padding: "14px 16px" }}
          >
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--acc-navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--acc-navy)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{personName}</div>
              <div style={{ fontSize: 11.5, color: "var(--acc-body-muted)" }}>Academic co-ordinator</div>
            </div>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--acc-surface)", borderBottom: "1px solid var(--acc-border)", display: "flex", alignItems: "center", gap: 14, padding: "12px 26px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--acc-panel)", border: "1px solid var(--acc-border)", borderRadius: 10, padding: "9px 12px", flex: 1, minWidth: 220, maxWidth: 520 }}>
            <span style={{ color: "var(--acc-tertiary)", fontSize: 13 }}>Search</span>
            <input placeholder="students, teachers, notices…" style={{ border: 0, background: "transparent", outline: "none", flex: 1, fontSize: 14, color: "var(--acc-text)", minWidth: 60 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <AskAiWidget onOpenChange={setAiChatOpen} />
            {stageOptions.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--acc-border)", borderRadius: 10, padding: "6px 10px", background: "#fff" }}>
                <span style={{ fontSize: 11, letterSpacing: "0.07em", color: "var(--acc-tertiary)", fontWeight: 700 }}>SCOPE</span>
                <select
                  value={currentStage}
                  onChange={(e) => setStage(e.target.value)}
                  disabled={stageOptions.length <= 1}
                  style={{ border: 0, outline: "none", background: "transparent", fontSize: 13.5, fontWeight: 700, color: "var(--acc-navy)", cursor: stageOptions.length > 1 ? "pointer" : "default", maxWidth: 230 }}
                >
                  {stageOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.gradeRangeLabel} · {STAGE_LABEL[o.value] ?? o.value}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--acc-accent-tint)", border: "1px solid var(--acc-accent-border)", color: "var(--acc-accent)", borderRadius: 9, padding: "8px 12px", fontSize: 13, fontWeight: 700 }}>
              Academic co-ordinator
            </div>
          </div>
        </div>

        <div style={{ padding: "26px 26px 60px", display: "flex", flexDirection: "column", gap: 22 }}>{children}</div>
      </div>
    </div>
    </FlashProvider>
  );
}

function LogoutButton() {
  return (
    <button type="submit" style={{ all: "unset", cursor: "pointer", display: "block", width: "100%", boxSizing: "border-box", padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "var(--acc-red)" }}>
      Sign out
    </button>
  );
}
