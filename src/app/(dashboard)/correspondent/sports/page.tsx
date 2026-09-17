// Correspondent's Sports oversight -- read-only, same real GET /sports/overview
// Admin's own page calls (already grants CORRESPONDENT -- see
// sports-admin-overview.controller.ts's own comment). Reuses the exact same
// SportsOversightPanel Admin's "Oversight" tab renders -- teams, tournaments,
// OD requests, achievements, outstanding equipment are all Sports Faculty's
// own mobile-created data; nothing here can be edited. Coaches passed as []
// since GET /coaches is Admin-only (coaches.controller.ts) -- the panel's own
// coachById lookup already falls back to "--" when a coach isn't resolvable,
// so this never needs that Admin-only endpoint.

import { redirect } from "next/navigation";
import { SportsOversightPanel, type SportsOverview } from "@/components/sports/SportsOversightPanel";
import { apiFetch, AuthExpiredError } from "@/lib/api";

export default async function CorrespondentSportsPage() {
  let overview: SportsOverview | null;
  try {
    const res = await apiFetch("/sports/overview");
    overview = res.ok ? ((await res.json()) as { data: SportsOverview }).data : null;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Sports</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Sports</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1024px]">
      <h1 className="text-[38px] font-bold leading-[1.08] tracking-[-0.028em] text-text">Sports</h1>
      <p className="mt-1 text-sm text-text-muted">
        Teams, training, tournaments, results, achievements, OD requests and equipment issue/return are created and
        managed on mobile by Sports Faculty — read-only here.
      </p>
      <div className="mt-6">
        <SportsOversightPanel overview={overview} coaches={[]} />
      </div>
    </div>
  );
}
