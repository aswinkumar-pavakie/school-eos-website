import { redirect } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { getBook, listBookCopies, listCategories } from "@/lib/library-api";
import { formatDate, formatMoney, statusLabel, statusTone } from "@/lib/format";
import { EditBookModal } from "./EditBookModal";
import { AddCopyModal } from "./AddCopyModal";
import { CopyRowActions } from "./CopyRowActions";
import { withdrawBookAction } from "../actions";

function WithdrawBookButton({ bookId }: { bookId: string }) {
  return (
    <form action={withdrawBookAction.bind(null, bookId)}>
      <button type="submit" className="rounded-[11px] border border-border px-3.5 py-2 text-sm font-semibold text-critical-text hover:bg-field">
        Withdraw book
      </button>
    </form>
  );
}

export default async function LibraryBookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const [book, copies, categories] = await Promise.all([getBook(id), listBookCopies(id), listCategories()]);

    return (
      <div className="mx-auto max-w-[900px]">
        <BackLink href="/library/books" label="Back to Books" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold leading-[34px] text-text">{book.title}</h1>
            <p className="mt-1.5 text-sm text-text-muted">
              {book.author}
              {book.categoryName && ` · ${book.categoryName}`}
              {book.publicationYear && ` · ${book.publicationYear}`}
              {book.isbn && <span className="font-mono"> · {book.isbn}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill tone={statusTone(book.status)} label={statusLabel(book.status)} />
            <EditBookModal book={book} categories={categories} />
            {book.status === "ACTIVE" && <WithdrawBookButton bookId={book.id} />}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-[14px] sm:grid-cols-4 lg:grid-cols-8">
          {([
            ["Total", book.copiesSummary.total],
            ["Available", book.copiesSummary.available],
            ["Issued", book.copiesSummary.issued],
            ["Reserved", copies.filter((c) => c.status === "RESERVED").length],
            ["Lost", book.copiesSummary.lost],
            ["Damaged", book.copiesSummary.damaged],
            ["Under repair", book.copiesSummary.underRepair],
            ["Retired", book.copiesSummary.retired],
          ] as [string, number][]).map(([label, value]) => (
            <div key={label} className="rounded-[14px] border border-border bg-surface p-3 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">{label}</p>
              <p className="mt-1 font-mono text-xl font-extrabold text-text">{value}</p>
            </div>
          ))}
        </div>

        {book.description && (
          <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Description</h2>
            <p className="mt-2 text-sm text-text-muted">{book.description}</p>
          </section>
        )}

        <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Copies ({copies.length})</h2>
            {book.status === "ACTIVE" && <AddCopyModal bookId={book.id} />}
          </div>

          <div className="mt-3 overflow-x-auto rounded-[14px] border border-border">
            <table className="w-full min-w-[760px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[13%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[13%]" />
                <col className="w-[32%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase leading-[14px] tracking-[0.09em] text-text-muted">
                  <th className="px-4 py-3">Copy code</th>
                  <th className="px-4 py-3">Shelf</th>
                  <th className="px-4 py-3">Acquired</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {copies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-text-muted">No copies yet -- add the first one.</td>
                  </tr>
                )}
                {copies.map((copy) => (
                  <tr key={copy.id} className="align-middle">
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-text">{copy.copyCode}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-muted">{copy.shelfLocation ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-muted">{copy.acquisitionDate ? formatDate(copy.acquisitionDate) : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-text-muted">
                      {copy.acquisitionCostPaise !== null && copy.acquisitionCostPaise !== undefined ? formatMoney(copy.acquisitionCostPaise) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={statusTone(copy.status)} label={statusLabel(copy.status)} />
                    </td>
                    <td className="px-4 py-3">
                      <CopyRowActions bookId={book.id} copy={copy} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this book</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
