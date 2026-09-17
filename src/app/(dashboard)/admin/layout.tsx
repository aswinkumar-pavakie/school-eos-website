import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Shell } from "@/components/dashboard/Shell";
import { ReframeThemeStyle, reframeThemeClassName } from "@/components/dashboard/ReframeTheme";
import { ReframeHeaderChrome } from "@/components/dashboard/ReframeHeaderChrome";
import { ACCESS_TOKEN_COOKIE, apiFetch } from "@/lib/api";
import { listAcademicYears, listApprovals, getSchoolProfile } from "@/lib/finance-api";
import { listAcademicTerms } from "@/lib/academic-term-api";
import { logoutAction } from "./actions";

// Same first-letter-of-each-word initials helper Principal's layout uses for
// its sidebar header/footer tiles.
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

const REFRAME_SCOPE = "admin-theme";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
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

  // Every backend endpoint under /admin/* already enforces @Roles('ADMIN'), so
  // this redirect isn't the real security boundary -- but without it, a
  // non-Admin who lands here (stale bookmark, typed URL) sees the full shell
  // render before every single data fetch on the page 401s out from under
  // them, instead of a clean bounce to their own portal. Same check Library's
  // and Finance's own layouts already do for their roles.
  if (!data.roles.some((r) => r.role_code === "ADMIN")) {
    redirect("/login");
  }

  const personName = [data.person.firstName, data.person.lastName].filter(Boolean).join(" ");
  const roleCode = data.roles[0]?.role_code ?? "ADMIN";
  const roleLabel = ROLE_LABELS[roleCode] ?? roleCode;

  // The bell's one real, honest "notification" -- real pending Admin approval
  // requests, not a fabricated alerts feed. Best-effort: a failed fetch just
  // means no badge, never a broken page. Counts BOTH real sources Admin can
  // decide: the 6-type /approval-requests module Admin authors itself, and
  // the generic /approvals engine's own requests routed to ADMIN (e.g. a
  // Principal's own leave, self-approval blocked) -- see
  // admin/requests/actions.ts's own comment on this same gap. Before this fix
  // the badge silently undercounted whenever a generic-engine request was
  // the only one pending.
  const [pendingRes, genericPending] = await Promise.all([
    apiFetch("/approval-requests?view=pending&limit=1"),
    listApprovals({ status: "PENDING" }).catch(() => []),
  ]);
  const pendingRequestsCount =
    (pendingRes.ok ? ((await pendingRes.json()) as { meta: { total: number } }).meta.total : 0) +
    genericPending.length;

  // Design reframe (per the user's "change the components in admin ... also"
  // instruction) -- same scoped token/font cascade + header chrome as
  // Principal's own layout, Admin's real nav/data/functionality untouched.
  const academicYears = await listAcademicYears().catch(() => []);
  const currentYear = academicYears.find((y) => y.isCurrent) ?? academicYears[0];
  const terms = currentYear ? await listAcademicTerms(currentYear.id).catch(() => []) : [];
  const currentTerm = terms.find((t) => t.isCurrent) ?? terms[0];
  const schoolProfile = await getSchoolProfile().catch(() => null);
  const schoolName = schoolProfile?.name ?? "School EOS";

  return (
    <div className={reframeThemeClassName(REFRAME_SCOPE)}>
      <ReframeThemeStyle scope={REFRAME_SCOPE} />
      <Shell
        personName={personName}
        roleLabel={roleLabel}
        onSignOut={logoutAction}
        pendingRequestsCount={pendingRequestsCount}
        headerExtra={
          <ReframeHeaderChrome academicYearName={currentYear?.name} termName={currentTerm?.name} />
        }
        // Sidebar logo tile + real school name + role subtitle, and sidebar
        // footer identity card -- same real chrome Principal's layout already
        // has, per the user's "implement in admin and vice_principal also"
        // instruction. Purely additive visual chrome; the header's existing
        // notification bell + avatar sign-out menu is untouched.
        sidebarHeader={
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-[#0f2342] text-[13px] font-bold text-white">
              {initials(schoolName)}
            </div>
            <div className="flex min-w-0 flex-col gap-px">
              <div className="truncate text-[16px] font-semibold leading-tight tracking-[-0.01em] text-text">{schoolName}</div>
              <div className="truncate text-[12px] leading-tight text-text-muted">Administration</div>
            </div>
          </div>
        }
        sidebarFooter={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f2342] text-[13px] font-semibold text-white">
              {initials(personName || "Admin")}
            </div>
            <div className="flex min-w-0 flex-col gap-px">
              <div className="truncate text-[14px] font-semibold leading-tight text-text">{personName}</div>
              <div className="truncate text-[12px] leading-tight text-text-muted">School administrator</div>
            </div>
          </div>
        }
      >
        {children}
      </Shell>
    </div>
  );
}
