import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MediaShell } from "@/components/media-ui/MediaShell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { getMediaDashboard, getMediaInventoryOverview } from "@/lib/media-api";
import { logoutAction } from "@/app/(dashboard)/admin/actions";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

interface MeResponse {
  data: { person: { id: string; firstName: string; lastName: string | null; email: string | null } };
}

export default async function MediaLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) redirect("/login");

  const actor = await getCurrentActor().catch(() => null);
  if (!actor || !actor.roles.includes("MEDIA_ROOM")) redirect("/login");

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";
  const personEmail = me?.data.person.email ?? "";

  // Real counts for the sidebar badges -- never the design's own hardcoded
  // "4" placeholders.
  const [dashboard, inventoryOverview] = await Promise.all([
    getMediaDashboard().catch(() => null),
    getMediaInventoryOverview().catch(() => null),
  ]);

  const now = new Date();
  const academicYearLabel = now.getMonth() >= 5 ? `${now.getFullYear()}-${String(now.getFullYear() + 1).slice(2)}` : `${now.getFullYear() - 1}-${String(now.getFullYear()).slice(2)}`;

  return (
    <MediaShell
      personName={personName}
      personEmail={personEmail}
      academicYearLabel={academicYearLabel}
      inventoryCount={inventoryOverview?.total ?? 0}
      indentCount={dashboard?.pendingIndents ?? 0}
      onSignOut={logoutAction}
    >
      {children}
    </MediaShell>
  );
}
