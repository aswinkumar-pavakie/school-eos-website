// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isEmpLibrary"
// screen. Reuses EXISTING real listLibraryBooks/listLibraryCategories/
// listMyIssues unchanged. E-resources has no real data source (no
// e-resources list function anywhere in faculty-staff-api.ts) -- degrades
// via GapNotice. No renew action exists in the real lib either, so the
// "Renew" button isn't rendered (never a fake control).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listLibraryBooks, listLibraryCategories, listMyIssues } from "@/lib/faculty-staff-api";
import { Tabs } from "@/components/faculty-ui/Tabs";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { GapNotice } from "@/components/faculty-ui/GapNotice";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string; categoryId?: string }>;
}) {
  try {
    const { tab, search, categoryId } = await searchParams;
    const activeTab = tab === "Search" || tab === "E-resources" || tab === "History" ? tab : "Borrowed";

    return (
      <div>
        <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Library</h1>
        <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>School library</p>

        <div style={{ marginTop: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8, background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: 12, padding: 6 }}>
            {["Borrowed", "Search", "E-resources", "History"].map((t) => (
              <a
                key={t}
                href={`/faculty/library?tab=${t}`}
                style={{ border: 0, borderRadius: 9, padding: "14px 0", textAlign: "center", font: "600 14.5px/1 var(--fac-font-sans)", background: t === activeTab ? "var(--fac-primary)" : "transparent", color: t === activeTab ? "#fff" : "var(--fac-body)" }}
              >
                {t}
              </a>
            ))}
          </div>
        </div>

        {activeTab === "Borrowed" && <BorrowedTab />}
        {activeTab === "Search" && <SearchTab search={search} categoryId={categoryId} />}
        {activeTab === "E-resources" && (
          <div style={{ marginTop: 18 }}>
            <GapNotice feature="E-resources (DIKSHA, NCERT e-Pathshala, etc.)" />
          </div>
        )}
        {activeTab === "History" && <HistoryTab />}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the library. Nothing was changed -- try again." />;
  }
}

async function BorrowedTab() {
  const { data: issues, hasLibraryCard } = await listMyIssues();
  const active = issues.filter((i) => !i.returnedAt);

  if (!hasLibraryCard) {
    return (
      <div style={{ marginTop: 18 }}>
        <FacultyEmptyState message="You don't have a library membership on record." />
      </div>
    );
  }
  if (active.length === 0) {
    return (
      <div style={{ marginTop: 18 }}>
        <FacultyEmptyState message="No books currently issued to you." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5" style={{ marginTop: 18 }}>
      {active.map((i) => (
        <div key={i.id} className="fac-hover-lift flex items-center gap-4.5" style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "18px 20px" }}>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", font: "700 17px/1.3 var(--fac-font-sans)" }}>{i.bookTitle}</span>
            <span style={{ display: "block", font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>
              Issued {new Date(i.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · Due {new Date(i.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          </span>
          <span style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".06em", borderRadius: 20, padding: "8px 13px", background: i.isOverdue ? "var(--fac-red-bg)" : "var(--fac-tint)", color: i.isOverdue ? "var(--fac-red-text)" : "var(--fac-primary)" }}>
            {i.isOverdue ? `${i.daysOverdue} DAYS OVERDUE` : "ON TIME"}
          </span>
        </div>
      ))}
    </div>
  );
}

async function SearchTab({ search, categoryId }: { search?: string; categoryId?: string }) {
  const [{ data: books }, categories] = await Promise.all([listLibraryBooks({ search, categoryId }), listLibraryCategories()]);

  return (
    <div style={{ marginTop: 18 }}>
      <form action="/faculty/library" style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "18px 20px", display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 14 }}>
        <input type="hidden" name="tab" value="Search" />
        <input name="search" defaultValue={search ?? ""} placeholder="Search by title, author or ISBN" style={{ border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }} />
        <select name="categoryId" defaultValue={categoryId ?? ""} style={{ border: "1px solid var(--fac-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--fac-font-sans)" }}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button type="submit" style={{ border: 0, background: "var(--fac-primary)", color: "#fff", cursor: "pointer", font: "600 14.5px/1 var(--fac-font-sans)", borderRadius: 10, padding: "13px 26px" }}>
          Search catalogue
        </button>
      </form>
      <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", marginTop: 16, overflow: "hidden" }}>
        <div className="grid" style={{ gridTemplateColumns: "2.2fr 1.3fr 1fr", padding: "14px 20px", background: "var(--fac-panel)", borderBottom: "1px solid var(--fac-border)", font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".07em", color: "var(--fac-body-muted)" }}>
          <div>TITLE</div>
          <div>AUTHOR</div>
          <div>AVAILABILITY</div>
        </div>
        {books.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", font: "400 15px/1.5 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>No books found.</div>
        ) : (
          books.map((b) => (
            <div key={b.id} className="fac-hover-lift grid items-center" style={{ gridTemplateColumns: "2.2fr 1.3fr 1fr", padding: "15px 20px", borderBottom: "1px solid var(--fac-divider)" }}>
              <div style={{ font: "600 14.5px/1.3 var(--fac-font-sans)" }}>{b.title}</div>
              <div style={{ font: "400 14px/1.3 var(--fac-font-sans)", color: "#475569" }}>{b.author ?? "--"}</div>
              <div>
                <span style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".06em", borderRadius: 20, padding: "7px 12px", background: b.copiesSummary.available > 0 ? "var(--fac-tint)" : "var(--fac-red-bg)", color: b.copiesSummary.available > 0 ? "var(--fac-primary)" : "var(--fac-red-text)" }}>
                  {b.copiesSummary.available} of {b.copiesSummary.total}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

async function HistoryTab() {
  const { data: issues } = await listMyIssues();
  const returned = issues.filter((i) => i.returnedAt);

  if (returned.length === 0) {
    return (
      <div style={{ marginTop: 18 }}>
        <FacultyEmptyState message="No past library issues." />
      </div>
    );
  }

  return (
    <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", marginTop: 18, overflow: "hidden" }}>
      <div className="grid" style={{ gridTemplateColumns: "2.2fr 1fr 1fr 1fr", padding: "14px 20px", background: "var(--fac-panel)", borderBottom: "1px solid var(--fac-border)", font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".07em", color: "var(--fac-body-muted)" }}>
        <div>TITLE</div>
        <div>ISSUED</div>
        <div>RETURNED</div>
        <div>STATUS</div>
      </div>
      {returned.map((r) => (
        <div key={r.id} className="fac-hover-lift grid items-center" style={{ gridTemplateColumns: "2.2fr 1fr 1fr 1fr", padding: "15px 20px", borderBottom: "1px solid var(--fac-divider)" }}>
          <div style={{ font: "600 14.5px/1.3 var(--fac-font-sans)" }}>{r.bookTitle}</div>
          <div style={{ font: "400 14px/1.2 var(--fac-font-sans)", color: "#475569" }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
          <div style={{ font: "400 14px/1.2 var(--fac-font-sans)", color: "#475569" }}>{r.returnedAt ? new Date(r.returnedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "--"}</div>
          <div>
            <span style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".06em", borderRadius: 20, padding: "7px 12px", background: "var(--fac-tint)", color: "var(--fac-primary)" }}>RETURNED</span>
          </div>
        </div>
      ))}
    </div>
  );
}
