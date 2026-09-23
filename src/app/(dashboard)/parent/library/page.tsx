// Library -- now renders the shared src/components/shared-ui/LibraryView,
// the same canonical screen Faculty's own faculty/library/page.tsx renders.
// Real library_issue + library_book data (getLibrarySummary/
// searchLibraryCatalog) -- same real data as before (including the real
// pending-fine amount, now shown as an extra stat tile + inline per-row fine
// label, both additive to Faculty's own screen, never removed).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { formatMoneySummary } from "@/lib/format";
import { getLibrarySummary, listChildren, resolveSelectedChild, searchLibraryCatalog } from "@/lib/parent-api";
import { LibraryView, type LibraryTab } from "@/components/shared-ui/LibraryView";

const TAB_MAP: Record<string, LibraryTab> = { Search: "Search", "E-resources": "E-resources", History: "History" };

export default async function ParentLibraryPage({ searchParams }: { searchParams: Promise<{ studentId?: string; tab?: string; search?: string }> }) {
  try {
    const { studentId: requestedStudentId, tab, search } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const activeTab: LibraryTab = (tab && TAB_MAP[tab]) || "Borrowed";
    const summary = await getLibrarySummary(selected.studentId);
    const catalog = activeTab === "Search" ? await searchLibraryCatalog(selected.studentId, search) : [];

    return (
      <div className="parent-scope">
        <LibraryView
          basePath={`/parent/library?studentId=${selected.studentId}`}
          subtitle={`${selected.studentName} · ${[selected.gradeName, selected.sectionName].filter(Boolean).join("-")}`}
          activeTab={activeTab}
          statTiles={[
            { label: "Books issued", value: String(summary.stats.issuedCount) },
            { label: "Due soon", value: String(summary.stats.dueSoonCount) },
            { label: "Pending fine", value: formatMoneySummary(summary.stats.pendingFinePaise), tone: Number(summary.stats.pendingFinePaise) > 0 ? "red" : "default" },
          ]}
          hasLibraryCard={summary.hasLibraryCard}
          borrowed={summary.borrowed.map((r) => ({ ...r, fineLabel: r.isOverdue ? formatMoneySummary(r.projectedFinePaise) : null }))}
          history={summary.history}
          books={catalog}
          categories={[]}
          search={search}
          searchParamNames={{ search: "search", categoryId: "categoryId" }}
        />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the library."} />;
  }
}
