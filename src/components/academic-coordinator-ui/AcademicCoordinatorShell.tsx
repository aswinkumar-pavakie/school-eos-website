"use client";

// A genuinely separate portal from /faculty, not a nav item inside it -- per
// the product decision: an account that is both FACULTY and
// ACADEMIC_COORDINATOR (a real, distinct role_assignment scoped by
// scope_stage -- see nav-items.ts's own comment) keeps using /faculty for
// its own classes, and reaches this portal separately for stage-wide
// co-ordination duties.
//
// Chrome (navbar/sidebar/logout/profile row) delegates entirely to the one
// shared AppShell (src/components/shared-ui/AppShell.tsx) -- identical markup
// to every other role's login. Only this role's own real behavior lives
// here: its nav items, the stage-scope selector (a real ?stage=... URL param
// every page reads), the conditional "Go to Faculty console" link, sign-out.

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { NavIcon } from "./icons";
import { ACADEMIC_COORDINATOR_NAV } from "./nav-items";
import { FlashProvider } from "./FlashContext";
import { AppShell, type AppShellNavGroup } from "../shared-ui/AppShell";
import "../../app/(dashboard)/academic-coordinator/academic-coordinator-theme.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

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
  children,
}: {
  personName: string;
  /** Real stage(s) this coordinator is actually scoped to (from
   * getCoordinatorMe()) -- never other coordinators' scopes. Usually one. */
  stageOptions: StageOption[];
  /** False for a genuinely separate coordinator-only login (no FACULTY
   * role_code at all) -- that account has nowhere to go in /faculty, so the
   * "Go to Faculty console" link is hidden rather than offering a dead end. */
  hasFacultyAccess: boolean;
  onSignOut: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStage =
    searchParams.get("stage") && stageOptions.some((o) => o.value === searchParams.get("stage"))
      ? (searchParams.get("stage") as string)
      : (stageOptions[0]?.value ?? "");

  function setStage(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("stage", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const navGroups: AppShellNavGroup[] = ACADEMIC_COORDINATOR_NAV.map((g) => ({
    label: g.title,
    items: g.items.map((item) => ({
      href: item.href,
      label: item.label,
      icon: <NavIcon id={item.id} stroke="var(--color-text-muted)" />,
      activeIcon: <NavIcon id={item.id} stroke="var(--color-primary)" />,
    })),
  }));

  return (
    <FlashProvider>
      <div className={`academic-coordinator-scope ${outfit.variable} ${jetBrainsMono.variable}`}>
        <AppShell
          rootHref="/academic-coordinator"
          navGroups={navGroups}
          personName={personName}
          personRoleLabel="Academic co-ordinator"
          searchPlaceholder="Search students, teachers, notices…"
          profileHref="/academic-coordinator/profile"
          footerExtra={
            hasFacultyAccess ? (
              <Link
                href="/faculty"
                title="Go to Faculty console"
                style={{
                  flexShrink: 0,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  font: "600 12px/1 var(--font-sans)",
                  color: "var(--color-navy)",
                  textDecoration: "none",
                }}
              >
                Faculty
              </Link>
            ) : undefined
          }
          headerExtra={
            stageOptions.length > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--color-border)", borderRadius: 8, padding: "6px 10px", background: "var(--color-surface)" }}>
                <span style={{ fontSize: 11, letterSpacing: "0.07em", color: "var(--color-text-tertiary)", fontWeight: 700 }}>SCOPE</span>
                <select
                  value={currentStage}
                  onChange={(e) => setStage(e.target.value)}
                  disabled={stageOptions.length <= 1}
                  style={{ border: 0, outline: "none", background: "transparent", fontSize: 13.5, fontWeight: 700, color: "var(--color-navy)", cursor: stageOptions.length > 1 ? "pointer" : "default", maxWidth: 230 }}
                >
                  {stageOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.gradeRangeLabel} · {STAGE_LABEL[o.value] ?? o.value}
                    </option>
                  ))}
                </select>
              </div>
            ) : undefined
          }
        >
          {children}
        </AppShell>
      </div>
    </FlashProvider>
  );
}
