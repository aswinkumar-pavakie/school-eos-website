// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isEmpLibrary"
// screen. Reuses EXISTING real listLibraryBooks/listLibraryCategories/
// listMyIssues unchanged. Now renders the shared
// src/components/shared-ui/LibraryView -- Faculty's screen is the
// canonical design every other role's own Library feature also renders
// verbatim (see parent/library/page.tsx). No renew action exists in the
// real lib either, so the "Renew" button isn't rendered (never a fake
// control).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listLibraryBooks, listLibraryCategories, listMyIssues } from "@/lib/faculty-staff-api";
import { LibraryView, type LibraryTab } from "@/components/shared-ui/LibraryView";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string; categoryId?: string }>;
}) {
  try {
    const { tab, search, categoryId } = await searchParams;
    const activeTab: LibraryTab = tab === "Search" || tab === "E-resources" || tab === "History" ? tab : "Borrowed";

    const { data: issues, hasLibraryCard } = await listMyIssues();
    const books = activeTab === "Search" ? (await listLibraryBooks({ search, categoryId })).data : [];
    const categories = activeTab === "Search" ? await listLibraryCategories() : [];

    return (
      <LibraryView
        basePath="/faculty/library"
        subtitle="School library"
        activeTab={activeTab}
        hasLibraryCard={hasLibraryCard}
        borrowed={issues.filter((i) => !i.returnedAt).map((i) => ({ ...i, id: i.id }))}
        history={issues.filter((i) => i.returnedAt)}
        books={books}
        categories={categories}
        search={search}
        categoryId={categoryId}
      />
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the library. Nothing was changed -- try again." />;
  }
}
