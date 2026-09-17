// Library dashboard -- pixel-rebuilt from brain/SIS LIBRARY/School Library
// Module.dc.html's own Dashboard screen. Two honest adaptations from the
// design, both because the real data genuinely doesn't exist the way the
// mockup assumes (confirmed against the live DB, not guessed):
//  1. "Copies available by grade band" -> "Copies available by subject" --
//     library_book has no grade-band field at all (see BooksPage's own
//     comment); subject (category) is the real, closest breakdown.
//  2. "Total eBooks" stays wired to a real value, which is genuinely 0 --
//     there is no ebook table/column anywhere in this schema (confirmed via
//     the live DB's PostgREST listing and mobile's own faculty-library-api.ts
//     comment). Zero is the honest count, not a placeholder.
// Everything else (available/issued/overdue/lost+damaged counts, recent
// activity) is real, unmodified getLibraryOverview() data, same source the
// pre-rebuild dashboard used.

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AuthExpiredError } from "@/lib/api";
import { getLibraryOverview, listBooks, listTransactionHistory } from "@/lib/library-api";
import { formatFullDate, nowMs, todayIsoDate } from "@/lib/library-time";
import { Card, StatCard } from "@/components/library-ui/primitives";

function StatIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#1D4ED8" strokeWidth={1.7}>
      {children}
    </svg>
  );
}

export default async function LibraryDashboardPage() {
  try {
    const today = todayIsoDate(nowMs());
    const [overview, { data: books }, todayHistory] = await Promise.all([
      getLibraryOverview(),
      listBooks({ limit: 200 }),
      listTransactionHistory({ startDate: today, endDate: today, limit: 200 }),
    ]);

    const issuedToday = todayHistory.data.filter((e) => e.action.toUpperCase().includes("ISSUE")).length;
    const returnedToday = todayHistory.data.filter((e) => e.action.toUpperCase().includes("RETURN")).length;

    const bySubject = new Map<string, { available: number; total: number }>();
    for (const b of books) {
      const key = b.categoryName ?? "Uncategorised";
      const entry = bySubject.get(key) ?? { available: 0, total: 0 };
      entry.available += b.copiesSummary.available;
      entry.total += b.copiesSummary.total;
      bySubject.set(key, entry);
    }
    const subjectBars = [...bySubject.entries()]
      .filter(([, v]) => v.total > 0)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 6);
    const maxSubjectTotal = Math.max(1, ...subjectBars.map(([, v]) => v.total));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 style={{ margin: 0, font: "700 38px/1.15 var(--lib-font-sans)", color: "var(--lib-ink)" }}>Library dashboard</h1>
          <div style={{ font: "400 16px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
            School overview · Library Module · {formatFullDate(nowMs())}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 20 }}>
          <StatCard
            title="Available books"
            value={overview.availableCopies.toLocaleString()}
            sub={`of ${overview.totalCopies.toLocaleString()} total copies`}
            href="/library/books"
            icon={
              <StatIcon>
                <circle cx="10" cy="10" r="7" />
                <path d="M7 10.2l2 2 4-4.4" />
              </StatIcon>
            }
          />
          <StatCard
            title="Active borrowings"
            value={overview.issuedCopies.toLocaleString()}
            sub="currently checked out"
            href="/library/circulation"
            icon={
              <StatIcon>
                <rect x="4" y="3" width="12" height="14" rx="2" />
                <path d="M7.5 10l2 2 3.5-4" />
              </StatIcon>
            }
          />
          <StatCard
            title="Overdue books"
            value={overview.overdueCount.toLocaleString()}
            sub="need follow-up with class teachers"
            href="/library/fines"
            highlighted
            icon={
              <StatIcon>
                <circle cx="10" cy="10" r="7" />
                <path d="M10 6v4.3l3 1.7" />
              </StatIcon>
            }
          />
          <StatCard
            title="Today’s activity"
            value={(issuedToday + returnedToday).toLocaleString()}
            sub={`${issuedToday} issued · ${returnedToday} returned`}
            href="/library/history"
            icon={
              <StatIcon>
                <rect x="3" y="4.5" width="14" height="12" rx="2" />
                <path d="M3 8.5h14M7 3v3M13 3v3" />
              </StatIcon>
            }
          />
          <StatCard
            title="Total eBooks"
            value="0"
            sub="published to the school portal"
            href="/library/ebooks"
            icon={
              <StatIcon>
                <rect x="2.5" y="5" width="15" height="10" rx="1.6" />
                <path d="M10 5v10" />
              </StatIcon>
            }
          />
          <StatCard
            title="Lost & damaged"
            value={(overview.lostCopies + overview.damagedCopies).toLocaleString()}
            sub={`${overview.lostCopies} lost · ${overview.damagedCopies} damaged`}
            href="/library/lost-damaged"
            icon={
              <StatIcon>
                <circle cx="10" cy="10" r="7" />
                <path d="M10 6v5M10 13.6v.2" />
              </StatIcon>
            }
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 20 }}>
          <Card style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ font: "600 20px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>Copies available by subject</div>
            <div style={{ font: "400 14px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)", marginBottom: 14 }}>
              Available copies out of each subject’s total
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {subjectBars.length === 0 && (
                <div style={{ font: "400 14px/1.5 var(--lib-font-sans)", color: "var(--lib-tertiary)" }}>No books catalogued yet.</div>
              )}
              {subjectBars.map(([label, v]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 130, font: "500 13px/1.2 var(--lib-font-sans)", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {label}
                  </div>
                  <div style={{ flex: 1, height: 8, borderRadius: 999, background: "var(--lib-tint)", overflow: "hidden" }}>
                    <div style={{ height: 8, borderRadius: 999, background: "var(--lib-primary)", width: `${Math.round((v.total / maxSubjectTotal) * 100)}%` }} />
                  </div>
                  <div style={{ font: "500 13px/1.2 var(--lib-font-mono)", color: "#475569" }}>{v.available} / {v.total}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ font: "600 20px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>Recent activity</div>
            <div style={{ font: "400 14px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)", marginBottom: 8 }}>
              Latest issues, returns and reported losses
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {overview.recentActivity.length === 0 && (
                <div style={{ padding: "14px 0", font: "400 14px/1.5 var(--lib-font-sans)", color: "var(--lib-tertiary)" }}>No activity recorded yet.</div>
              )}
              {overview.recentActivity.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderTop: "1px solid var(--lib-divider)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--lib-tint)", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                    <StatIcon>
                      <rect x="4" y="3" width="12" height="14" rx="2" />
                      <path d="M7.5 10l2 2 3.5-4" />
                    </StatIcon>
                  </div>
                  <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ font: "500 15px/1.35 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{a.detail || a.action}</div>
                    <div style={{ font: "400 13px/1.3 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>{formatFullDate(new Date(a.occurredAt).getTime())}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", background: "var(--lib-white)", padding: 32, textAlign: "center" }}>
        <p style={{ font: "600 15px/1.3 var(--lib-font-sans)" }}>Couldn&apos;t load the Library dashboard</p>
        <p style={{ marginTop: 6, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
