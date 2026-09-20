import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SportsShell } from "@/components/sports-ui/SportsShell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { logoutAction } from "@/app/(dashboard)/admin/actions";
import { listOdRequests, listEquipmentIndents } from "@/lib/sports-admin-api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

interface MeResponse {
  data: { person: { id: string; firstName: string; lastName: string | null } };
}

export default async function SportsAdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) redirect("/login");

  const actor = await getCurrentActor().catch(() => null);
  if (!actor || !actor.roles.includes("SPORTS_ADMIN")) redirect("/login");

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  const [odRequests, indents] = await Promise.all([
    listOdRequests().catch(() => []),
    listEquipmentIndents().catch(() => []),
  ]);
  const odCount = odRequests.filter((r) => r.state === "PENDING").length;
  const indentsCount = indents.filter((i) => i.state === "PENDING").length;

  const now = new Date();
  const academicYearLabel = now.getMonth() >= 5 ? `${now.getFullYear()}–${String(now.getFullYear() + 1).slice(2)}` : `${now.getFullYear() - 1}–${String(now.getFullYear()).slice(2)}`;

  return (
    <SportsShell
      personName={personName}
      academicYearLabel={academicYearLabel}
      odCount={odCount}
      indentsCount={indentsCount}
      onSignOut={logoutAction}
    >
      {children}
    </SportsShell>
  );
}
