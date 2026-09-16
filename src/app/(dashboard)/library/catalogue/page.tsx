// Subjects & racks -- pixel-rebuilt from the design's own two-tab screen.
// Subjects maps directly onto the real library_category table (rename
// cascades automatically -- books reference categoryId, not a copied name
// string). Racks has no real entity at all in this schema (confirmed: no
// rack table, only a free-text shelfLocation on each library_book_copy) --
// rather than fake a code/shelves/subject-range registry, this tab shows the
// real, derived aggregate (every distinct shelf location actually in use,
// with its real copy count and the real subjects sitting on it) and drops
// the design's Add/Edit rack actions, which have nothing real to do.

import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import { listBookCopies, listBooks, listCategories } from "@/lib/library-api";
import { Breadcrumb } from "@/components/library-ui/primitives";
import { CatalogueTabs } from "./CatalogueTabs";

export default async function LibraryCataloguePage() {
  try {
    const [categories, { data: books }] = await Promise.all([listCategories(), listBooks({ limit: 200 })]);

    const subjectRows = categories.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      count: books.filter((b) => b.categoryId === c.id).length,
    }));

    // N+1 across a genuinely small real dataset (confirmed live: 25 books /
    // 48 copies total) -- fine for an admin screen, not worth a new bulk
    // endpoint for this size.
    const allCopies = (
      await Promise.all(
        books.map(async (b) => (await listBookCopies(b.id)).map((c) => ({ ...c, bookTitle: b.title, subject: b.categoryName }))),
      )
    ).flat();

    const byShelf = new Map<string, { copies: number; subjects: Set<string> }>();
    for (const c of allCopies) {
      const key = c.shelfLocation?.trim() || null;
      if (!key) continue;
      const entry = byShelf.get(key) ?? { copies: 0, subjects: new Set<string>() };
      entry.copies += 1;
      if (c.subject) entry.subjects.add(c.subject);
      byShelf.set(key, entry);
    }
    const rackRows = [...byShelf.entries()]
      .map(([code, v]) => ({ code, copies: v.copies, subjects: [...v.subjects].sort().join(", ") || "—" }))
      .sort((a, b) => a.code.localeCompare(b.code));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <Breadcrumb label="Subjects & racks" />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 style={{ margin: 0, font: "700 38px/1.15 var(--lib-font-sans)" }}>Subjects & racks</h1>
          <div style={{ font: "400 16px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Catalogue classification and shelf assignment.</div>
        </div>
        <CatalogueTabs subjectRows={subjectRows} rackRows={rackRows} />
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", background: "var(--lib-white)", padding: 32, textAlign: "center" }}>
        <p style={{ font: "600 15px/1.3 var(--lib-font-sans)" }}>Couldn&apos;t load Subjects &amp; racks</p>
        <p style={{ marginTop: 6, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
