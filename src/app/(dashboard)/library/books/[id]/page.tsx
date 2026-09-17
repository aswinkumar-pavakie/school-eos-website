// Book detail (copies) -- the design has no screen for this at all (its own
// Books list treats a title as one row with a single accession + copies
// count, never drilling into individual physical copies). Real schema needs
// it: library_book_copy tracks each physical copy separately (its own
// copyCode/shelfLocation/status/acquisition cost), so this page is where the
// design's own "Accession / QR code", "Rack" and "Price per copy" field
// labels actually belong -- reused verbatim here even though this exact
// screen isn't pictured, restyled to the same tokens as every pixel-matched
// screen for visual consistency. CopyRowActions (the working per-copy
// action menu) is left as-is -- untouched, already real, not worth a full
// reskin for a screen with no design target.

import { redirect } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { AuthExpiredError } from "@/lib/api";
import { getBook, listBookCopies, listCategories } from "@/lib/library-api";
import { formatDate, formatMoney } from "@/lib/format";
import { Breadcrumb, EmptyRow, Pill, TableShell, Td, Th } from "@/components/library-ui/primitives";
import { EditBookModal } from "./EditBookModal";
import { AddCopyModal } from "./AddCopyModal";
import { CopyRowActions } from "./CopyRowActions";
import { DeleteBookButton } from "../DeleteBookButton";

export default async function LibraryBookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const [book, copies, categories] = await Promise.all([getBook(id), listBookCopies(id), listCategories()]);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <Breadcrumb label={book.title} />
        <BackLink href="/library/books" label="Back to Books" />
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h1 style={{ margin: 0, font: "700 38px/1.15 var(--lib-font-sans)" }}>{book.title}</h1>
            <div style={{ font: "400 16px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
              {book.author}
              {book.categoryName && ` · ${book.categoryName}`}
              {book.isbn && <span className="lib-font-mono"> · {book.isbn}</span>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Pill label={book.status === "ACTIVE" ? "Active" : "Withdrawn"} tone={book.status === "ACTIVE" ? "green" : "red"} />
            <EditBookModal book={book} categories={categories} />
            {book.status === "ACTIVE" && <DeleteBookButton bookId={book.id} title={book.title} />}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 14 }}>
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
            <div key={label} style={{ border: "1px solid var(--lib-border)", borderRadius: 14, padding: 12, textAlign: "center" }}>
              <p style={{ margin: 0, font: "700 11px/1.4 var(--lib-font-sans)", letterSpacing: ".09em", textTransform: "uppercase", color: "var(--lib-body-muted)" }}>{label}</p>
              <p className="lib-font-mono" style={{ margin: "4px 0 0", font: "700 21px/1 var(--lib-font-mono)", color: "var(--lib-ink)" }}>{value}</p>
            </div>
          ))}
        </div>

        {book.description && (
          <section style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", padding: 18 }}>
            <h2 style={{ margin: 0, font: "600 15px/1.3 var(--lib-font-sans)" }}>Description</h2>
            <p style={{ marginTop: 8, font: "400 14px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>{book.description}</p>
          </section>
        )}

        <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, font: "600 22px/1.3 var(--lib-font-sans)" }}>Copies ({copies.length})</h2>
            {book.status === "ACTIVE" && <AddCopyModal bookId={book.id} />}
          </div>

          <TableShell>
            <thead>
              <tr style={{ background: "var(--lib-panel)" }}>
                <Th>Accession / QR code</Th>
                <Th>Rack</Th>
                <Th>Acquired</Th>
                <Th align="right">Price per copy</Th>
                <Th>Status</Th>
                <th style={{ padding: "14px 18px" }} />
              </tr>
            </thead>
            <tbody>
              {copies.length === 0 && <EmptyRow colSpan={6} label="No copies yet — add the first one." />}
              {copies.map((copy) => (
                <tr key={copy.id} className="lib-row-hover">
                  <Td mono>{copy.copyCode}</Td>
                  <Td>{copy.shelfLocation ?? "—"}</Td>
                  <Td>{copy.acquisitionDate ? formatDate(copy.acquisitionDate) : "—"}</Td>
                  <Td align="right" mono>{copy.acquisitionCostPaise !== null && copy.acquisitionCostPaise !== undefined ? formatMoney(copy.acquisitionCostPaise) : "—"}</Td>
                  <Td>
                    <Pill
                      label={copy.status.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase())}
                      tone={copy.status === "AVAILABLE" ? "green" : copy.status === "LOST" || copy.status === "DAMAGED" || copy.status === "RETIRED" ? "red" : "blue"}
                    />
                  </Td>
                  <Td align="right">
                    <CopyRowActions bookId={book.id} copy={copy} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </section>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", background: "var(--lib-white)", padding: 32, textAlign: "center" }}>
        <p style={{ font: "600 15px/1.3 var(--lib-font-sans)" }}>Couldn&apos;t load this book</p>
        <p style={{ marginTop: 6, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
