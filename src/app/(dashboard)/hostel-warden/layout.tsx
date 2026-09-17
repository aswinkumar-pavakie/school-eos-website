import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HostelWardenShell } from "@/components/hostel-warden-ui/HostelWardenShell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { logoutAction } from "@/app/(dashboard)/admin/actions";
import { listEmergencyExitRequests, listGatePassRequests } from "@/lib/hostel-warden-api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function HostelWardenLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    redirect("/login");
  }

  const actor = await getCurrentActor().catch(() => null);
  if (!actor) redirect("/login");
  if (!actor.roles.includes("HOSTEL_WARDEN")) redirect("/login");

  // Real name for the sidebar footer -- same direct /auth/me fetch pattern every
  // other role's layout.tsx uses (getCurrentActor() only returns personId/roles).
  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  // Real pending-approvals count for the nav badge + bell badge -- both gate
  // pass and emergency exit requests count toward it, matching the design's
  // own `pendingCount` (all outstanding movement-log requests, not just one
  // kind). Never fabricated: if either call fails, the badge is simply
  // omitted (Shell treats `undefined` as "hide badge"), not shown as zero.
  let pendingApprovalsCount: number | undefined;
  try {
    const [gatePasses, emergencyExits] = await Promise.all([listGatePassRequests(), listEmergencyExitRequests()]);
    // outing_request.state's own real CHECK constraint is REQUESTED / APPROVED
    // / REJECTED / CANCELLED / COMPLETED -- confirmed live (a freshly created
    // request comes back "REQUESTED", not "PENDING"; that generic value
    // belongs to the separate approval_request.state column, a different
    // table this warden-facing endpoint never returns). COMPLETED is a real
    // constraint value nothing in the codebase ever writes yet -- there is no
    // "mark as returned" action today, so it never appears in practice.
    pendingApprovalsCount = [...gatePasses, ...emergencyExits].filter((r) => r.state === "REQUESTED").length;
  } catch {
    pendingApprovalsCount = undefined;
  }

  return (
    <HostelWardenShell personName={personName} pendingApprovalsCount={pendingApprovalsCount} onSignOut={logoutAction}>
      {children}
    </HostelWardenShell>
  );
}
