// Minimal placeholder landing page -- exists only because the login flow redirects
// here. The real dashboard (module navigation, per-role layout, etc.) is a separate,
// much larger piece of work outside this task's scope.
//
// Reads the access token directly rather than going through lib/api.ts's apiFetch:
// that helper refreshes-and-rewrites cookies when the token is stale, which Next.js
// only allows from a Server Action or Route Handler, not a page's Server Component
// render. A page load with a stale token falls back to a full redirect to /login
// instead of a silent refresh -- the silent refresh (via apiFetch) is what backs
// every authenticated Server Action call once real dashboard features exist here.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE } from "@/lib/api";
import { logoutAction } from "./actions";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

interface MeResponse {
  data: {
    person: { id: string; firstName: string; lastName: string | null; email: string | null };
    roles: { role_code: string; scope_type: string; scope_id: string | null }[];
  };
}

export default async function DashboardPage() {
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold text-text">
          Welcome, {data.person.firstName}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {data.roles.map((r) => r.role_code).join(", ")}
        </p>

        <form action={logoutAction} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-md border border-border px-4 py-2.5 font-bold text-text transition-colors hover:bg-bg"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
