import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { formatDate, orDash } from "@/lib/format";
import { listLibraryBooks, listLibraryCategories, listMyIssues } from "@/lib/faculty-staff-api";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string; categoryId?: string }>;
}) {
  try {
    const { tab, search, categoryId } = await searchParams;
    const myIssuesTab = tab === "my-issues";

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-text">Library</h1>
          <p className="mt-1 text-sm text-text-muted">Catalogue search and your own issued books.</p>
        </div>

        <div className="flex gap-2 border-b border-border">
          <Link href="/faculty/library" className={`px-3 py-2 text-sm font-bold ${!myIssuesTab ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}>Catalogue</Link>
          <Link href="/faculty/library?tab=my-issues" className={`px-3 py-2 text-sm font-bold ${myIssuesTab ? "border-b-2 border-primary text-primary" : "text-text-muted"}`}>My issues</Link>
        </div>

        {myIssuesTab ? <MyIssuesTab /> : <CatalogueTab search={search} categoryId={categoryId} />}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the library. Nothing was changed — try again." />;
  }
}

async function CatalogueTab({ search, categoryId }: { search?: string; categoryId?: string }) {
  const [{ data: books }, categories] = await Promise.all([
    listLibraryBooks({ search, categoryId }),
    listLibraryCategories(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <form action="/faculty/library" className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="tab" value="catalogue" />
        <input name="search" defaultValue={search ?? ""} placeholder="Search title, author…" className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text" />
        <select name="categoryId" defaultValue={categoryId ?? ""} className="rounded-[var(--radius-input)] border border-border bg-field px-3.5 py-2.5 text-sm text-text">
          <option value="">Category: All</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <PlainButton type="submit" variant="secondary">Search</PlainButton>
        <Link href="/faculty/library" className="text-xs font-bold text-text-muted hover:text-text">Clear</Link>
      </form>

      {books.length === 0 ? (
        <EmptyState title="No books found" body="Try a different search or category." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => (
            <div key={b.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
              <p className="text-sm font-bold text-text">{b.title}</p>
              <p className="text-xs text-text-muted">{orDash(b.author)}{b.categoryName ? ` · ${b.categoryName}` : ""}</p>
              <p className="mt-2 text-xs font-semibold text-text-muted">
                {b.copiesSummary.available} of {b.copiesSummary.total} available
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function MyIssuesTab() {
  const { data: issues, hasLibraryCard } = await listMyIssues();

  if (!hasLibraryCard) {
    return <EmptyState title="No library card yet" body="You don't have a library membership on record." />;
  }
  if (issues.length === 0) {
    return <EmptyState title="No books issued" body="You have no current or past library issues." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {issues.map((i) => (
        <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-4">
          <div>
            <p className="text-sm font-bold text-text">{i.bookTitle}</p>
            <p className="text-xs text-text-muted">
              Issued {formatDate(i.issuedAt)} · Due {formatDate(i.dueDate)}
              {i.returnedAt ? ` · Returned ${formatDate(i.returnedAt)}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {i.isOverdue ? <StatusPill state="OVERDUE" /> : <StatusPill state={i.status} />}
          </div>
        </div>
      ))}
    </div>
  );
}
