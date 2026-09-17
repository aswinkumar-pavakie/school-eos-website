// Library -- pixel-rebuilt from the design's own isLibrary screen
// (Borrowed / Search / History tabs). Real library_issue + library_book
// data (getLibrarySummary/searchLibraryCatalog).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill, type PillTone } from "@/components/parent-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { getLibrarySummary, listChildren, resolveSelectedChild, searchLibraryCatalog, type LibraryIssueRow } from "@/lib/parent-api";

const TABS = [
  { key: "borrowed", label: "Borrowed" },
  { key: "search", label: "Search catalogue" },
  { key: "history", label: "History" },
] as const;

function statusTone(row: LibraryIssueRow): PillTone {
  if (row.isOverdue) return "red";
  if (row.status === "RETURNED") return "gray";
  return "blue";
}

export default async function ParentLibraryPage({ searchParams }: { searchParams: Promise<{ studentId?: string; tab?: string; q?: string }> }) {
  try {
    const { studentId: requestedStudentId, tab, q } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const activeTab = tab === "search" || tab === "history" ? tab : "borrowed";
    const summary = await getLibrarySummary(selected.studentId);
    const catalog = activeTab === "search" ? await searchLibraryCatalog(selected.studentId, q) : [];

    return (
      <div className="parent-scope">
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6, color: "var(--par-ink)" }}>Library</div>
          <div style={{ fontSize: 15, color: "var(--par-body-muted)" }}>{selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join("-")}</div>
        </div>

        {!summary.hasLibraryCard ? (
          <EmptyPanel label="No library card issued for this child yet." />
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 16, marginBottom: 20 }}>
              <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>Books issued</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--par-ink)" }}>{summary.stats.issuedCount}</div>
              </div>
              <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>Due soon</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "var(--par-ink)" }}>{summary.stats.dueSoonCount}</div>
              </div>
              <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--par-tertiary)", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>Pending fine</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: Number(summary.stats.pendingFinePaise) > 0 ? "var(--par-red)" : "var(--par-ink)" }}>
                  {formatMoneySummary(summary.stats.pendingFinePaise)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {TABS.map((t) => (
                <a key={t.key} href={`/parent/library?studentId=${selected.studentId}&tab=${t.key}`} style={{ textDecoration: "none" }}>
                  <span
                    style={{
                      display: "inline-block",
                      borderRadius: 9,
                      padding: "10px 18px",
                      fontSize: 14,
                      fontWeight: 700,
                      background: activeTab === t.key ? "var(--par-navy)" : "#fff",
                      color: activeTab === t.key ? "#fff" : "var(--par-ink)",
                      border: activeTab === t.key ? undefined : "1px solid var(--par-border)",
                    }}
                  >
                    {t.label}
                  </span>
                </a>
              ))}
            </div>

            {activeTab === "borrowed" && <IssueList rows={summary.borrowed} emptyLabel="No books currently borrowed." />}
            {activeTab === "history" && <IssueList rows={summary.history} emptyLabel="No borrowing history yet." />}
            {activeTab === "search" && (
              <div>
                <form action={`/parent/library`} method="get" style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  <input type="hidden" name="studentId" value={selected.studentId} />
                  <input type="hidden" name="tab" value="search" />
                  <input
                    type="text"
                    name="q"
                    defaultValue={q ?? ""}
                    placeholder="Search by title, author or ISBN…"
                    style={{ flex: 1, border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-input)", padding: "12px 16px", fontSize: 14, fontFamily: "inherit" }}
                  />
                  <button type="submit" style={{ border: 0, borderRadius: 9, padding: "0 22px", fontSize: 14, fontWeight: 700, background: "var(--par-primary)", color: "#fff", cursor: "pointer" }}>
                    Search
                  </button>
                </form>

                {catalog.length === 0 ? (
                  <EmptyPanel label={q ? "No books matched your search." : "Search the catalogue by title, author or ISBN."} />
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 16 }}>
                    {catalog.map((b) => (
                      <div key={b.id} style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 14, padding: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--par-ink)", marginBottom: 4 }}>{b.title}</div>
                        <div style={{ fontSize: 12.5, color: "var(--par-body-muted)", marginBottom: 10 }}>{b.author ?? "Unknown author"}</div>
                        <div style={{ fontSize: 12, color: "var(--par-tertiary-2)", marginBottom: 10 }}>{b.categoryName ?? ""}{b.isbn ? ` · ${b.isbn}` : ""}</div>
                        <StatusPill label={b.copiesSummary.available > 0 ? `${b.copiesSummary.available} available` : "All copies issued"} tone={b.copiesSummary.available > 0 ? "blue" : "gray"} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the library."} />;
  }
}

function IssueList({ rows, emptyLabel }: { rows: LibraryIssueRow[]; emptyLabel: string }) {
  if (rows.length === 0) return <EmptyPanel label={emptyLabel} />;
  return (
    <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, overflow: "hidden" }}>
      {rows.map((r) => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderBottom: "1px solid var(--par-divider)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: "var(--par-tint)", color: "var(--par-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
              <path d="M4 4h5v16H4zM11 4h5v16h-5zM18.2 5l3 14.6" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--par-ink)" }}>{r.bookTitle}</div>
            <div style={{ fontSize: 12.5, color: "var(--par-body-muted)" }}>
              Issued {formatDate(r.issuedAt)} · Due {formatDate(r.dueDate)}
              {r.returnedAt ? ` · Returned ${formatDate(r.returnedAt)}` : ""}
            </div>
          </div>
          {r.isOverdue && <div style={{ fontSize: 12.5, color: "var(--par-red)", fontWeight: 700, flexShrink: 0 }}>{r.daysOverdue}d overdue · {formatMoneySummary(r.projectedFinePaise)}</div>}
          <StatusPill label={r.isOverdue ? "Overdue" : r.status} tone={statusTone(r)} />
        </div>
      ))}
    </div>
  );
}
