// Admin's Library oversight -- a read-only summary, NOT a second Library operator
// interface. Pulls GET /library/overview and GET /library/issues?overdueOnly --
// day-to-day catalog, circulation and member management stay with the Library
// role's own module at /library, which Admin does not "view as". Pixel-matched
// via the shared LibraryOverviewView -- see that component's own comment for
// exact mockup values and what's deliberately omitted (no real grade-band/
// ebook data).

import { redirect } from "next/navigation";
import { LibraryOverviewView } from "@/components/library/LibraryOverviewView";
import { AuthExpiredError } from "@/lib/api";
import { getLibraryOverview, listIssues } from "@/lib/library-api";

export default async function AdminLibraryOverviewPage() {
  try {
    const [overview, overdueRes] = await Promise.all([
      getLibraryOverview(),
      listIssues({ overdueOnly: true, limit: 20 }),
    ]);

    return <LibraryOverviewView overview={overview} overdueIssues={overdueRes.data} financeHref="/finance/library" />;
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
