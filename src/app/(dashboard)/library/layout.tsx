import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LibraryShell } from "@/components/library-ui/LibraryShell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
// logoutAction is genuinely shared across Admin/Finance/Library -- see finance/layout.tsx's
// own comment for why it lives under admin/ rather than a since-removed placeholder route.
import { logoutAction } from "@/app/(dashboard)/admin/actions";
import { nowMs } from "@/lib/library-time";
import { E2eeBootstrapMount } from "@/lib/e2ee/E2eeBootstrapMount";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function LibraryLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");
  // Deliberately LIBRARY-only, not "|| ADMIN" -- unlike Finance (which Admin can
  // also operate), Library's own operational shell is not something Admin should
  // be able to view-as; Admin's oversight is the separate /admin/library page.
  if (!actor.roles.includes("LIBRARY")) redirect("/login");

  // Real name for the avatar/menu -- same direct /auth/me fetch pattern Finance's
  // own layout uses (getCurrentActor() only returns personId/roles, not a display name).
  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  // Display-only "2026–27"-style label for the topbar pill -- same derivation
  // as the Faculty rebuild's own layout.tsx (India's academic year runs
  // June-May), since there's no LIBRARY-authorized academic-year label
  // endpoint either.
  const now = new Date(nowMs());
  const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const academicYear = `${startYear}–${String(startYear + 1).slice(-2)}`;

  return (
    <>
      <E2eeBootstrapMount personId={actor.personId} />
      <LibraryShell personName={personName} academicYear={academicYear} onSignOut={logoutAction}>
        {children}
      </LibraryShell>
    </>
  );
}
