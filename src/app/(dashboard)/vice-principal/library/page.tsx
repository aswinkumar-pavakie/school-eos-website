// Vice Principal's Library oversight -- read-only, real GET /library/overview
// only. No "Overdue & fines" table here: circulation.controller.ts's own GET
// routes (library/issues) only grant LIBRARY/ADMIN/PRINCIPAL, not
// VICE_PRINCIPAL -- same Principal-sees-it/Vice-Principal-doesn't split
// already used for financial/circulation detail elsewhere in this app (e.g.
// ProfileHeader's annualIncomePaise). No Finance link either -- Vice
// Principal has no Finance-facing route of its own. Pixel-matched via the
// shared LibraryOverviewView -- see that component's own comment for exact
// mockup values and what's deliberately omitted.

import { redirect } from "next/navigation";
import { LibraryOverviewView } from "@/components/library/LibraryOverviewView";
import { AuthExpiredError } from "@/lib/api";
import { getLibraryOverview } from "@/lib/library-api";

export default async function VicePrincipalLibraryOverviewPage() {
  // Data fetching kept in its own try/catch, separate from the JSX below --
  // React doesn't actually catch render errors via a JS try/catch around
  // constructed JSX (only a real error boundary does).
  let overview: Awaited<ReturnType<typeof getLibraryOverview>>;
  try {
    overview = await getLibraryOverview();
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Library oversight</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  return <LibraryOverviewView overview={overview} />;
}
