// Canteen counter's shell -- now the Faculty-style bespoke design
// (CanteenShell, canteen-ui/) instead of the shared Admin Shell this
// portal used before, per explicit instruction to replicate that exact
// visual system for the whole module now that a real Dashboard exists too.

import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CanteenShell } from "@/components/canteen-ui/CanteenShell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function CanteenLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");
  // Every backend endpoint under /canteen/* already enforces
  // @Roles('CANTEEN_VENDOR') -- this redirect isn't the real security
  // boundary, it just avoids a non-canteen login seeing this shell render
  // before every data fetch on the page 401s out from under them.
  if (!actor.roles.includes("CANTEEN_VENDOR")) redirect("/login");

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  return (
    <CanteenShell personName={personName} onSignOut={logoutAction}>
      {children}
    </CanteenShell>
  );
}
