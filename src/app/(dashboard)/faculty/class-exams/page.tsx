// Class Teacher's Exams -- mirrors the mobile Exams screen: Upcoming /
// Finished tabs (bucketed off each paper's own real exam date, never a
// server guess at "now"), a per-subject filter, and for Finished papers a
// drill-in to student-wise marks. Real data only: GET /faculty/exams/subjects.

import { redirect } from "next/navigation";
import Link from "next/link";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listExamSubjects, type ExamSubjectRow } from "@/lib/faculty-exams-api";
import { Tabs } from "@/components/faculty-ui/Tabs";
import { Card } from "@/components/faculty-ui/Card";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatExamDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function hrefFor(tab: string, subject: string | null): string {
  const params = new URLSearchParams();
  if (tab !== "upcoming") params.set("tab", tab);
  if (subject) params.set("subject", subject);
  const qs = params.toString();
  return qs ? `/faculty/class-exams?${qs}` : "/faculty/class-exams";
}

export default async function ClassExamsPage({ searchParams }: { searchParams: Promise<{ tab?: string; subject?: string }> }) {
  const { tab: tabParam, subject: subjectParam } = await searchParams;
  const tab: "upcoming" | "finished" = tabParam === "finished" ? "finished" : "upcoming";
  let rows: ExamSubjectRow[];
  try {
    rows = await listExamSubjects();
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load the exams. Nothing was changed -- try again." />;
  }
  const today = todayIso();

  const upcoming: ExamSubjectRow[] = [];
  const finished: ExamSubjectRow[] = [];
  for (const r of rows) {
    // No date set yet -- treated as upcoming (not yet happened), never
    // silently dropped from either list.
    if (r.examDate && r.examDate < today) finished.push(r);
    else upcoming.push(r);
  }
  upcoming.sort((a, b) => (a.examDate ?? "9999-99-99").localeCompare(b.examDate ?? "9999-99-99"));
  finished.sort((a, b) => (b.examDate ?? "").localeCompare(a.examDate ?? ""));

  const subjects = [...new Set(rows.map((r) => r.subjectName))].sort();
  const subject = subjectParam && subjects.includes(subjectParam) ? subjectParam : null;
  const shown = (tab === "upcoming" ? upcoming : finished).filter((r) => !subject || r.subjectName === subject);

  return (
    <div>
      <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em", color: "var(--fac-navy)" }}>Exams</h1>
      <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
        Every subject&apos;s exams for your class
      </p>

      <div style={{ marginTop: 22 }}>
        <Tabs
          items={[
            { key: "upcoming", label: `Upcoming (${upcoming.length})`, href: hrefFor("upcoming", subject) },
            { key: "finished", label: `Finished (${finished.length})`, href: hrefFor("finished", subject) },
          ]}
          activeKey={tab}
        />
      </div>

      {subjects.length > 1 && (
        <div className="flex flex-wrap gap-2" style={{ marginTop: 14 }}>
          {[null, ...subjects].map((s) => {
            const active = s === subject;
            return (
              <Link
                key={s ?? "all"}
                href={hrefFor(tab, s)}
                className="fac-hover-lift"
                style={{
                  border: `1px solid ${active ? "var(--fac-primary)" : "var(--fac-border)"}`,
                  background: active ? "var(--fac-tint)" : "var(--fac-white)",
                  color: active ? "var(--fac-primary)" : "var(--fac-body)",
                  font: "600 13px/1 var(--fac-font-sans)",
                  borderRadius: 999,
                  padding: "9px 15px",
                }}
              >
                {s ?? "All subjects"}
              </Link>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        {shown.length === 0 ? (
          <FacultyEmptyState message={tab === "upcoming" ? "No upcoming exams." : "No finished exams yet."} />
        ) : (
          <Card padding="6px 22px">
            {shown.map((r) => {
              const inner = (
                <>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", font: "600 15px/1.3 var(--fac-font-sans)", color: "var(--fac-ink)" }}>
                      {r.subjectName} · {r.examName}
                    </span>
                    <span style={{ display: "block", font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 3 }}>
                      {r.gradeName} {r.sectionName}
                      {r.examDate ? ` · ${formatExamDate(r.examDate)}` : ""}
                      {r.startTime ? ` · ${r.startTime.slice(0, 5)}` : ""}
                    </span>
                  </span>
                  {tab === "finished" && (
                    <span style={{ font: "600 12px/1 var(--fac-font-sans)", color: "var(--fac-primary)", background: "var(--fac-tint)", borderRadius: 8, padding: "8px 12px" }}>
                      View marks
                    </span>
                  )}
                </>
              );
              const rowStyle = { display: "flex", alignItems: "center", gap: 12, padding: "16px 0", borderBottom: "1px solid var(--fac-divider)" } as const;
              return tab === "finished" ? (
                <Link
                  key={`${r.examId}-${r.subjectOfferingId}`}
                  href={`/faculty/class-exams/marks/${r.subjectOfferingId}/${r.examId}`}
                  className="fac-hover-lift"
                  style={rowStyle}
                >
                  {inner}
                </Link>
              ) : (
                <div key={`${r.examId}-${r.subjectOfferingId}`} style={rowStyle}>
                  {inner}
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
