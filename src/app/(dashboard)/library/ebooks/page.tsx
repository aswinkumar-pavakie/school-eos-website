// eBooks -- real backend now (library_ebook table, see
// database/migrations/0016_library_ebooks.sql and
// src/modules/library/ebooks.{controller,service}.ts). Was previously an
// honest always-empty gap screen (no ebook table existed anywhere in this
// schema) -- this is the real, working version. Each row is a real external
// link (resourceUrl); this app never stores or serves a file itself --
// "Open" just navigates straight to the official resource, exactly how a
// real school library's own eResources list works.

import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import { listCategories, listEbooks } from "@/lib/library-api";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { Breadcrumb, EmptyRow, Pill, TableShell, Th, Td } from "@/components/library-ui/primitives";
import { EbooksTabs } from "./EbooksTabs";
import { AddEbookButton } from "./AddEbookButton";
import { EbookRowActions } from "./EbookRowActions";

export default async function LibraryEbooksPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; subject?: string; status?: string }>;
}) {
  const params = await searchParams;

  try {
    const [categories, ebooksRes] = await Promise.all([
      listCategories(),
      listEbooks({
        search: params.search || undefined,
        categoryId: params.subject && params.subject !== "all" ? params.subject : undefined,
        status: params.status && params.status !== "all" ? params.status : undefined,
        limit: 100,
      }),
    ]);
    const ebooks = ebooksRes.data;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <Breadcrumb label="eBooks" />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 6 }}>
            <h1 style={{ margin: 0, font: "700 38px/1.15 var(--lib-font-sans)" }}>eBooks</h1>
            <div style={{ font: "400 16px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
              Digital copies available to students and parents through the school portal.
            </div>
          </div>
          <AddEbookButton categories={categories} />
        </div>

        <form action="/library/ebooks" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240, maxWidth: 420, display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", border: "1px solid var(--lib-border)", borderRadius: 11 }}>
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#94A3B8" strokeWidth={1.7}>
              <circle cx="9" cy="9" r="5.6" />
              <path d="M13.2 13.2L17 17" />
            </svg>
            <AutoSubmitSearchInput
              type="search"
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Title"
              style={{ flex: 1, border: 0, outline: "none", font: "400 15px/1.2 var(--lib-font-sans)", color: "var(--lib-ink)", background: "transparent" }}
            />
          </div>
          <AutoSubmitSelect
            name="subject"
            defaultValue={params.subject ?? "all"}
            style={{ padding: "13px 14px", border: "1px solid var(--lib-border)", borderRadius: 10, font: "400 15px/1.2 var(--lib-font-sans)", background: "var(--lib-white)", minWidth: 190 }}
          >
            <option value="all">All subjects</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </AutoSubmitSelect>
          <EbooksTabs status={params.status ?? "all"} search={params.search} subject={params.subject} />
        </form>

        <TableShell>
          <thead>
            <tr style={{ background: "var(--lib-panel)" }}>
              <Th>eBook</Th>
              <Th>Link</Th>
              <Th>Subject</Th>
              <Th>Status</Th>
              <th style={{ padding: "14px 18px" }} />
            </tr>
          </thead>
          <tbody>
            {ebooks.length === 0 && <EmptyRow colSpan={5} label="No eBooks published yet." />}
            {ebooks.map((e) => {
              let host = e.resourceUrl;
              try {
                host = new URL(e.resourceUrl).hostname.replace(/^www\./, "");
              } catch {
                // Keep the raw value if it's somehow not a parseable URL.
              }
              return (
                <tr key={e.id}>
                  <Td>
                    <span style={{ display: "block", font: "600 14.5px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{e.title}</span>
                    {e.author && <span style={{ display: "block", font: "400 12.5px/1.4 var(--lib-font-sans)", color: "var(--lib-tertiary)" }}>{e.author}</span>}
                  </Td>
                  <Td>{host}</Td>
                  <Td>{e.categoryName ?? "—"}</Td>
                  <Td>
                    <Pill label={e.status === "ACTIVE" ? "Active" : "Withdrawn"} tone={e.status === "ACTIVE" ? "green" : "red"} />
                  </Td>
                  <Td align="right">
                    <EbookRowActions id={e.id} status={e.status} resourceUrl={e.resourceUrl} />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", background: "var(--lib-white)", padding: 32, textAlign: "center" }}>
        <p style={{ font: "600 15px/1.3 var(--lib-font-sans)" }}>Couldn&apos;t load eBooks</p>
        <p style={{ marginTop: 6, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
