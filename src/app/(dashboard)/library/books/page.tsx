// Books catalogue -- pixel-rebuilt from the design's own Books screen. Two of
// its filter controls (Grade band, Rack) are dropped, not faked -- neither
// exists on library_book (grade-band) or library_book has no rack at all,
// only library_book_copy.shelfLocation (a per-copy fact, not filterable at
// the title level the design's own filter row implies). "Available only" IS
// real (copiesSummary.available > 0) but the backend has no query param for
// it, so it's applied as a real post-filter here rather than skipped.
// ISBN/Accession's own column shows the real ISBN -- accession numbers don't
// exist at the book-title level either (see CreateBookModal's comment).

import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthExpiredError } from "@/lib/api";
import { listBooks, listCategories } from "@/lib/library-api";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { AutoSubmitCheckbox } from "@/components/library-ui/AutoSubmitCheckbox";
import { Breadcrumb, EmptyRow, Pill, TableShell, Td, Th } from "@/components/library-ui/primitives";
import { CreateBookModal } from "./CreateBookModal";
import { EditBookModal } from "./[id]/EditBookModal";
import { DeleteBookButton } from "./DeleteBookButton";

const fieldStyle: CSSProperties = { padding: "12px 14px", border: "1px solid var(--lib-border)", borderRadius: 10, font: "400 15px/1.2 var(--lib-font-sans)", color: "var(--lib-ink)", background: "var(--lib-white)" };

export default async function LibraryBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; categoryId?: string; availableOnly?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const availableOnly = params.availableOnly === "true";

  try {
    const [{ data: rawBooks, meta }, categories] = await Promise.all([
      listBooks({ search: params.search || undefined, categoryId: params.categoryId || undefined, page, limit: 100 }),
      listCategories(),
    ]);
    const books = availableOnly ? rawBooks.filter((b) => b.copiesSummary.available > 0) : rawBooks;
    const total = meta?.total ?? books.length;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <Breadcrumb label="Books" />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 6 }}>
            <h1 style={{ margin: 0, font: "700 38px/1.15 var(--lib-font-sans)" }}>Books</h1>
            <div style={{ font: "400 16px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Every physical title with its live copy position.</div>
          </div>
          <CreateBookModal categories={categories} />
        </div>

        <form action="/library/books" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ maxWidth: 480, display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", border: "1px solid var(--lib-border)", borderRadius: 11 }}>
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#8593a8" strokeWidth={1.7}>
              <circle cx="9" cy="9" r="5.6" />
              <path d="M13.2 13.2L17 17" />
            </svg>
            <AutoSubmitSearchInput
              type="search"
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Title, author, ISBN or publisher"
              style={{ flex: 1, border: 0, outline: "none", font: "400 15px/1.2 var(--lib-font-sans)", color: "var(--lib-ink)", background: "transparent" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "18px 20px", border: "1px solid var(--lib-border)", borderRadius: 12 }}>
            <AutoSubmitSelect name="categoryId" defaultValue={params.categoryId ?? ""} style={{ ...fieldStyle, minWidth: 190 }}>
              <option value="">All subjects</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </AutoSubmitSelect>
            <label style={{ display: "flex", alignItems: "center", gap: 9, font: "400 15px/1.2 var(--lib-font-sans)", color: "var(--lib-ink)" }}>
              <AutoSubmitCheckbox name="availableOnly" value="true" defaultChecked={availableOnly} style={{ width: 17, height: 17, accentColor: "var(--lib-primary)" }} />
              Available only
            </label>
          </div>
        </form>

        <TableShell>
          <thead>
            <tr style={{ background: "var(--lib-panel)" }}>
              <Th>Book</Th>
              <Th>ISBN</Th>
              <Th>Subject</Th>
              <Th>Copies</Th>
              <Th>Status</Th>
              <th style={{ padding: "14px 18px" }} />
            </tr>
          </thead>
          <tbody>
            {books.length === 0 && <EmptyRow colSpan={6} />}
            {books.map((b) => (
              <tr key={b.id} className="lib-row-hover">
                <Td>
                  <div style={{ font: "500 15px/1.4 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{b.title}</div>
                  <div style={{ font: "400 13px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>{b.author}</div>
                </Td>
                <Td mono>{b.isbn ?? "—"}</Td>
                <Td>{b.categoryName ?? "—"}</Td>
                <Td mono>{b.copiesSummary.available} / {b.copiesSummary.total}</Td>
                <Td>
                  <Pill label={b.status === "ACTIVE" ? "Active" : "Withdrawn"} tone={b.status === "ACTIVE" ? "green" : "red"} />
                </Td>
                <Td align="right" style={{ whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                    <Link
                      href={`/library/books/${b.id}`}
                      title="View copies"
                      className="lib-surface-hover"
                      style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: "1px solid var(--lib-border)", borderRadius: 9, background: "var(--lib-white)", color: "var(--lib-body-muted)" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
                        <path d="M2.5 10s2.8-5.3 7.5-5.3S17.5 10 17.5 10s-2.8 5.3-7.5 5.3S2.5 10 2.5 10z" />
                        <circle cx="10" cy="10" r="2.3" />
                      </svg>
                    </Link>
                    <EditBookModal book={b} categories={categories} />
                    {b.status === "ACTIVE" && <DeleteBookButton bookId={b.id} title={b.title} />}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
        <div style={{ font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
          Showing 1–{books.length} of {total} titles
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", background: "var(--lib-white)", padding: 32, textAlign: "center" }}>
        <p style={{ font: "600 15px/1.3 var(--lib-font-sans)" }}>Couldn&apos;t load the catalogue</p>
        <p style={{ marginTop: 6, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
