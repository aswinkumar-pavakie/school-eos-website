// Book catalog -- search/filter/paginate, same shape as Admin's Inventory items
// list (src/app/(dashboard)/admin/inventory/page.tsx): Library's own pages are
// siblings of that one, not a new visual language.

import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { AuthExpiredError } from "@/lib/api";
import { listBooks, listCategories } from "@/lib/library-api";
import { statusLabel, statusTone } from "@/lib/format";
import { CreateBookModal } from "./CreateBookModal";

const STATUS_OPTIONS = ["ACTIVE", "WITHDRAWN"];

export default async function LibraryBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; categoryId?: string; author?: string; publisher?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  try {
    const [{ data: books, meta }, categories] = await Promise.all([
      listBooks({
        search: params.search || undefined,
        categoryId: params.categoryId || undefined,
        author: params.author || undefined,
        publisher: params.publisher || undefined,
        status: params.status || undefined,
        page,
        limit: 50,
      }),
      listCategories(),
    ]);
    const total = meta?.total ?? books.length;
    const limit = meta?.limit ?? 50;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    function hrefWith(overrides: Record<string, string | undefined>) {
      const next = new URLSearchParams();
      if (params.search) next.set("search", params.search);
      if (params.categoryId) next.set("categoryId", params.categoryId);
      if (params.author) next.set("author", params.author);
      if (params.publisher) next.set("publisher", params.publisher);
      if (params.status) next.set("status", params.status);
      next.set("page", String(page));
      for (const [key, value] of Object.entries(overrides)) {
        if (value === undefined) next.delete(key);
        else next.set(key, value);
      }
      return `/library/books?${next.toString()}`;
    }

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold leading-[34px] text-text">Books</h1>
            <p className="mt-1 text-sm text-text-muted">{total} titles in the catalog</p>
          </div>
          <CreateBookModal categories={categories} />
        </div>

        <form action="/library/books" className="mt-6 flex flex-wrap items-end gap-3">
          <AutoSubmitSearchInput
            type="search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search by title, author, or ISBN…"
            className="w-full max-w-md rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
          <AutoSubmitSelect
            name="categoryId"
            defaultValue={params.categoryId ?? ""}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text"
          >
            <option value="">Category: All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </AutoSubmitSelect>
          <AutoSubmitSearchInput
            type="search"
            name="author"
            defaultValue={params.author ?? ""}
            placeholder="Author…"
            className="w-40 rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
          <AutoSubmitSearchInput
            type="search"
            name="publisher"
            defaultValue={params.publisher ?? ""}
            placeholder="Publisher…"
            className="w-40 rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:bg-surface"
          />
          <AutoSubmitSelect
            name="status"
            defaultValue={params.status ?? ""}
            className="rounded-[11px] border border-border bg-field px-3.5 py-2.5 text-sm text-text"
          >
            <option value="">Status: All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </AutoSubmitSelect>
          <button type="submit" className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-semibold text-text hover:bg-bg">
            Filter
          </button>
          <Link href="/library/books" className="text-xs font-bold text-text-muted hover:text-text">
            Clear
          </Link>
        </form>

        <div className="mt-6 overflow-x-auto rounded-[16px] border border-border bg-surface">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Publisher</th>
                <th className="px-4 py-3">ISBN</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Available</th>
                <th className="px-4 py-3 text-right">Issued</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {books.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-text-muted">
                    No books match this filter.
                  </td>
                </tr>
              )}
              {books.map((book) => (
                <tr key={book.id}>
                  <td className="px-4 py-3 font-semibold text-text">{book.title}</td>
                  <td className="px-4 py-3 text-text-muted">{book.author}</td>
                  <td className="px-4 py-3 text-text-muted">{book.categoryName ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">{book.publisher ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">{book.isbn ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-text-muted">{book.copiesSummary.total}</td>
                  <td className="px-4 py-3 text-right font-mono text-text-muted">{book.copiesSummary.available}</td>
                  <td className="px-4 py-3 text-right font-mono text-text-muted">{book.copiesSummary.issued}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={statusTone(book.status)} label={statusLabel(book.status)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/library/books/${book.id}`} className="text-[13px] font-semibold text-primary">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={hrefWith({ page: String(page - 1) })} className="font-semibold text-primary">
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link href={hrefWith({ page: String(page + 1) })} className="font-semibold text-primary">
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load the catalog</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
