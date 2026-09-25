// Shared "Library" feature screen (consumer/borrower view -- Borrowed /
// Search / E-resources / History) -- the canonical pixel design ported from
// Faculty's own library/page.tsx, restyled to --eos-* tokens. A plain
// Server Component, exactly like Faculty's original (tab/search state is
// real query-param navigation, no client JS needed).
//
// E-resources used to be a GapNotice (no backend data source exists for a
// personalized e-resources list) -- the reference design shows a real,
// useful static directory of genuine national/open ed-tech resources
// (DIKSHA, NCERT e-Pathshala, National Digital Library, Khan Academy,
// Britannica School, Turnitin), which is real reference content, not
// fabricated personal data, so it's rendered for real here instead of a gap
// notice, identically for every role.

const TABS = ["Borrowed", "Search", "E-resources", "History"] as const;
export type LibraryTab = (typeof TABS)[number];

export interface LibraryIssueRow {
  id: string;
  bookTitle: string;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  isOverdue: boolean;
  daysOverdue?: number;
  /** Real money amount already formatted (e.g. "₹20") -- only Parent's data
   * source has fines; omitted entirely for Faculty, same as before. */
  fineLabel?: string | null;
}

export interface LibraryBookRow {
  id: string;
  title: string;
  author?: string | null;
  categoryName?: string | null;
  isbn?: string | null;
  copiesSummary: { available: number; total: number };
}

export interface LibraryCategoryRow {
  id: string;
  name: string;
}

const ERESOURCES = [
  { name: "DIKSHA", description: "Textbooks, lesson plans and teacher training content.", access: "CAMPUS + REMOTE", url: "https://diksha.gov.in" },
  { name: "NCERT e-Pathshala", description: "Digital textbooks and audio-visual resources.", access: "OPEN ACCESS", url: "https://epathshala.nic.in" },
  { name: "National Digital Library", description: "Reference books across subjects and grades.", access: "CAMPUS + REMOTE", url: "https://ndl.iitkgp.ac.in" },
  { name: "Khan Academy for Teachers", description: "Practice sets and video lessons for classes 6-10.", access: "OPEN ACCESS", url: "https://www.khanacademy.org" },
  { name: "Britannica School", description: "Curated encyclopaedia and project resources.", access: "CAMPUS ONLY", url: "https://school.eb.com" },
  { name: "Turnitin", description: "Originality check for project reports.", access: "LOGIN REQUIRED", url: "https://www.turnitin.com" },
];

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function LibraryView({
  basePath,
  subtitle,
  activeTab,
  statTiles,
  hasLibraryCard,
  borrowed,
  history,
  books,
  categories,
  search,
  categoryId,
  searchParamNames = { search: "search", categoryId: "categoryId" },
}: {
  /** e.g. "/faculty/library" or "/parent/library?studentId=abc" (may already
   * carry its own query params). */
  basePath: string;
  subtitle: string;
  activeTab: LibraryTab;
  /** Optional stat row above the tabs (Parent's real Books issued/Due soon/
   * Pending fine tiles) -- omitted entirely renders nothing, so Faculty's
   * screen is visually unchanged. */
  statTiles?: { label: string; value: string; tone?: "default" | "red" }[];
  hasLibraryCard: boolean;
  borrowed: LibraryIssueRow[];
  history: LibraryIssueRow[];
  books: LibraryBookRow[];
  categories: LibraryCategoryRow[];
  search?: string;
  categoryId?: string;
  searchParamNames?: { search: string; categoryId: string };
}) {
  const sep = basePath.includes("?") ? "&" : "?";
  const tabHref = (t: LibraryTab) => `${basePath}${sep}tab=${t}`;

  return (
    <div>
      <h1 style={{ margin: 0, font: "700 36px/1.1 var(--eos-font-sans)", letterSpacing: "-.02em", color: "var(--eos-ink)" }}>Library</h1>
      <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>{subtitle}</p>

      {!hasLibraryCard ? (
        <div style={{ marginTop: 22, padding: 40, textAlign: "center", background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", font: "400 14.5px/1.5 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>
          No library membership on record.
        </div>
      ) : (
        <>
          {statTiles && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3" style={{ marginTop: 18, marginBottom: 4 }}>
              {statTiles.map((s) => (
                <div key={s.label} style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: "16px 20px" }}>
                  <div style={{ font: "600 11px/1 var(--eos-font-sans)", letterSpacing: ".09em", color: "var(--eos-tertiary)" }}>{s.label.toUpperCase()}</div>
                  <div style={{ font: "700 24px/1.1 var(--eos-font-sans)", marginTop: 9, color: s.tone === "red" ? "var(--eos-red)" : "var(--eos-ink)" }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 8, background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: 12, padding: 6 }}>
              {TABS.map((t) => (
                <a
                  key={t}
                  href={tabHref(t)}
                  style={{ border: 0, borderRadius: 9, padding: "14px 0", textAlign: "center", font: "600 14.5px/1 var(--eos-font-sans)", background: t === activeTab ? "var(--eos-primary)" : "transparent", color: t === activeTab ? "#fff" : "var(--eos-body)", textDecoration: "none" }}
                >
                  {t}
                </a>
              ))}
            </div>
          </div>

          {activeTab === "Borrowed" && <IssueList rows={borrowed} emptyLabel="No books currently issued to you." />}
          {activeTab === "History" && <IssueList rows={history} emptyLabel="No past library issues." showStatus />}
          {activeTab === "Search" && (
            <div style={{ marginTop: 18 }}>
              <form action={basePath.split("?")[0]} style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: "18px 20px", display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 14 }}>
                <input type="hidden" name="tab" value="Search" />
                {basePath.includes("?") &&
                  basePath
                    .split("?")[1]
                    .split("&")
                    .map((pair) => {
                      const [k, v] = pair.split("=");
                      return <input key={k} type="hidden" name={k} value={decodeURIComponent(v ?? "")} />;
                    })}
                <input name={searchParamNames.search} defaultValue={search ?? ""} placeholder="Search by title, author or ISBN" style={{ border: "1px solid var(--eos-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--eos-font-sans)" }} />
                <select name={searchParamNames.categoryId} defaultValue={categoryId ?? ""} style={{ border: "1px solid var(--eos-border)", borderRadius: 10, padding: "13px 14px", font: "400 14.5px/1 var(--eos-font-sans)", background: "var(--eos-white)" }}>
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button type="submit" style={{ border: 0, background: "var(--eos-primary)", color: "#fff", cursor: "pointer", font: "600 14.5px/1 var(--eos-font-sans)", borderRadius: 10, padding: "13px 26px" }}>
                  Search catalogue
                </button>
              </form>
              <div style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", marginTop: 16, overflow: "hidden" }}>
                <div className="grid" style={{ gridTemplateColumns: "2.2fr 1.3fr 1fr", padding: "14px 20px", background: "var(--eos-panel)", borderBottom: "1px solid var(--eos-border)", font: "600 11px/1 var(--eos-font-sans)", letterSpacing: ".07em", color: "var(--eos-body-muted)" }}>
                  <div>TITLE</div>
                  <div>AUTHOR</div>
                  <div>AVAILABILITY</div>
                </div>
                {books.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", font: "400 15px/1.5 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>No books found.</div>
                ) : (
                  books.map((b) => (
                    <div key={b.id} className="grid items-center" style={{ gridTemplateColumns: "2.2fr 1.3fr 1fr", padding: "15px 20px", borderBottom: "1px solid var(--eos-divider)" }}>
                      <div style={{ font: "600 14.5px/1.3 var(--eos-font-sans)", color: "var(--eos-ink)" }}>{b.title}</div>
                      <div style={{ font: "400 14px/1.3 var(--eos-font-sans)", color: "var(--eos-body-muted)" }}>{b.author ?? "--"}</div>
                      <div>
                        <span style={{ font: "600 11px/1 var(--eos-font-sans)", letterSpacing: ".06em", borderRadius: 20, padding: "7px 12px", background: b.copiesSummary.available > 0 ? "var(--eos-tint)" : "var(--eos-red-bg)", color: b.copiesSummary.available > 0 ? "var(--eos-primary)" : "var(--eos-red-text)" }}>
                          {b.copiesSummary.available > 0 ? "AVAILABLE" : "NOT AVAILABLE"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {activeTab === "E-resources" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ marginTop: 18 }}>
              {ERESOURCES.map((r) => (
                <div key={r.name} style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: 18 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--eos-tint)", marginBottom: 14 }} />
                  <div style={{ font: "700 15.5px/1.3 var(--eos-font-sans)", color: "var(--eos-ink)" }}>{r.name}</div>
                  <div style={{ font: "400 12.5px/1.4 var(--eos-font-sans)", color: "var(--eos-tertiary)", marginTop: 6, minHeight: 34 }}>{r.description}</div>
                  <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
                    <span style={{ font: "600 10.5px/1 var(--eos-font-sans)", letterSpacing: ".04em", color: "var(--eos-primary)", background: "var(--eos-tint)", borderRadius: 20, padding: "5px 9px" }}>{r.access}</span>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ font: "600 12.5px/1 var(--eos-font-sans)", color: "var(--eos-primary)", textDecoration: "none" }}>
                      Open →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function IssueList({ rows, emptyLabel, showStatus }: { rows: LibraryIssueRow[]; emptyLabel: string; showStatus?: boolean }) {
  if (rows.length === 0) {
    return (
      <div style={{ marginTop: 18, padding: 40, textAlign: "center", background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", font: "400 14.5px/1.5 var(--eos-font-sans)", color: "var(--eos-tertiary)" }}>
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3.5" style={{ marginTop: 18 }}>
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-4.5" style={{ background: "var(--eos-white)", border: "1px solid var(--eos-border)", borderRadius: "var(--eos-radius-card)", padding: "18px 20px" }}>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", font: "700 17px/1.3 var(--eos-font-sans)", color: "var(--eos-ink)" }}>{r.bookTitle}</span>
            <span style={{ display: "block", font: "400 13px/1.4 var(--eos-font-sans)", color: "var(--eos-tertiary)", marginTop: 3 }}>
              Issued {formatShortDate(r.issuedAt)} · Due {formatShortDate(r.dueDate)}
              {r.returnedAt ? ` · Returned ${formatShortDate(r.returnedAt)}` : ""}
              {r.fineLabel ? ` · Fine ${r.fineLabel}` : ""}
            </span>
          </span>
          <span style={{ font: "600 11px/1 var(--eos-font-sans)", letterSpacing: ".06em", borderRadius: 20, padding: "8px 13px", background: r.isOverdue ? "var(--eos-red-bg)" : "var(--eos-tint)", color: r.isOverdue ? "var(--eos-red-text)" : "var(--eos-primary)" }}>
            {r.isOverdue ? `${r.daysOverdue ?? ""} DAYS OVERDUE`.trim() : showStatus && r.returnedAt ? "RETURNED" : "ON TIME"}
          </span>
        </div>
      ))}
    </div>
  );
}
