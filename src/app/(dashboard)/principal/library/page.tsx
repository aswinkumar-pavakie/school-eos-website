// Principal's Library oversight -- read-only, same real GET /library/overview
// + GET /library/issues?overdueOnly Admin's own page calls (both already
// grant PRINCIPAL). No Finance link -- Principal doesn't have its own
// Finance-facing /finance/library route. Pixel-matched via the shared
// LibraryOverviewView -- see that component's own comment for exact mockup
// values and what's deliberately omitted.

import { redirect } from "next/navigation";
import { LibraryOverviewView } from "@/components/library/LibraryOverviewView";
import { AuthExpiredError } from "@/lib/api";
import { getLibraryOverview, listIssues } from "@/lib/library-api";

export default async function PrincipalLibraryOverviewPage() {
  try {
    const [overview, overdueRes] = await Promise.all([
      getLibraryOverview(),
      listIssues({ overdueOnly: true, limit: 20 }),
    ]);

    return <LibraryOverviewView overview={overview} overdueIssues={overdueRes.data} />;
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load Library oversight</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
