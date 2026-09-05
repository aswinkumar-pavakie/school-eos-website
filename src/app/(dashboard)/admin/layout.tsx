import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { ACCESS_TOKEN_COOKIE, apiFetch } from "@/lib/api";
import { logoutAction } from "./actions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  PRINCIPAL: "Principal",
  FINANCE: "Finance",
};

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null };
    roles: { role_code: string }[];
  };
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/login");
  }

  const { data } = (await res.json()) as MeResponse;
  const personName = [data.person.firstName, data.person.lastName].filter(Boolean).join(" ");
  const roleCode = data.roles[0]?.role_code ?? "ADMIN";
  const roleLabel = ROLE_LABELS[roleCode] ?? roleCode;

  // The bell's one real, honest "notification" -- real pending Admin approval
  // requests, not a fabricated alerts feed. Best-effort: a failed fetch just
  // means no badge, never a broken page.
  const pendingRes = await apiFetch("/approval-requests?view=pending&limit=1");
  const pendingRequestsCount = pendingRes.ok
    ? ((await pendingRes.json()) as { meta: { total: number } }).meta.total
    : 0;

  return (
    <Shell personName={personName} roleLabel={roleLabel} onSignOut={logoutAction} pendingRequestsCount={pendingRequestsCount}>
      {children}
    </Shell>
  );
}
