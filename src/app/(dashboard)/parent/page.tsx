// Parent Home -- pixel-rebuilt from the design's own Home screen (brain/Copy
// of Parent web login design/ParentPortalPage.dc.html, isHome). Every tile
// is real data through parent-api.ts; the design's own "Rank 7 of 42" is
// NOT shown -- no real backend anywhere computes a parent-visible class
// rank (a parent-scoped endpoint has no access to every other student's
// marks to rank against), so that number is honestly omitted rather than
// invented.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import {
  getAttendance,
  getFeeSummary,
  getTimetable,
  listAnnouncements,
  listChildren,
  listFeeTerms,
  listHomework,
  listResultExams,
  getResults,
  resolveSelectedChild,
} from "@/lib/parent-api";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
function rupees(paise: string): string {
  return `₹${Math.round(Number(paise) / 100).toLocaleString("en-IN")}`;
}
function gradeFor(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  return "D";
}

export default async function ParentHomePage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const [attendance, homework, timetable, notices, resultExams, feeTerms] = await Promise.all([
      getAttendance(selected.studentId).catch(() => null),
      listHomework(selected.studentId).catch(() => []),
      getTimetable(selected.studentId).catch(() => ({ periods: [], slots: [] })),
      listAnnouncements(selected.studentId).catch(() => []),
      listResultExams(selected.studentId).catch(() => []),
      listFeeTerms(selected.studentId).catch(() => []),
    ]);

    const pendingHomework = homework.filter((h) => h.submissionStatus === "PENDING" || h.submissionStatus === "NOT_DONE");
    const dueToday = pendingHomework.filter((h) => h.dueDate && new Date(h.dueDate).toDateString() === new Date().toDateString());

    const latestExam = resultExams[resultExams.length - 1] ?? null;
    const latestResult = latestExam ? await getResults(selected.studentId, latestExam.examId).catch(() => null) : null;

    const latestTerm = feeTerms[feeTerms.length - 1] ?? null;
    const feeSummary = latestTerm ? await getFeeSummary(selected.studentId, latestTerm.academicYearId, latestTerm.instalmentNo).catch(() => null) : null;

    const today = new Date();
    const todayDow = today.getDay();
    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    const todaysSlots = timetable.slots
      .filter((s) => s.dayOfWeek === todayDow)
      .sort((a, b) => a.periodNo - b.periodNo);

    function toMinutes(t: string): number {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    }

    const attentionItems: { title: string; subtitle: string; href: string }[] = [];
    if (attendance && attendance.summary.percentage !== null && attendance.summary.percentage < 85) {
      attentionItems.push({ title: "Attendance below requirement", subtitle: `${attendance.summary.percentage}% · school requires 85%`, href: `/parent/attendance?studentId=${selected.studentId}` });
    }
    for (const h of dueToday) {
      attentionItems.push({ title: `${h.subjectName ?? "Homework"} due today`, subtitle: h.title, href: `/parent/homework?studentId=${selected.studentId}` });
    }
    if (feeSummary && Number(feeSummary.outstandingPaise) > 0) {
      attentionItems.push({ title: "Fees pending", subtitle: `${rupees(feeSummary.outstandingPaise)} outstanding`, href: `/parent/fees?studentId=${selected.studentId}` });
    }
    if (attentionItems.length === 0 && notices.length > 0) {
      attentionItems.push({ title: notices[0]!.title, subtitle: "New notice", href: `/parent/notices?studentId=${selected.studentId}` });
    }

    const classLabel = [selected.gradeName, selected.sectionName].filter(Boolean).join("-") || "—";

    return (
      <div className="parent-scope">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6, color: "var(--par-ink)" }}>
              {greeting()}, {selected.studentName ? `${selected.studentName.split(" ")[0]}'s parent` : "there"}
            </div>
            <div style={{ fontSize: 15, color: "var(--par-body-muted)" }}>
              {today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {selected.studentName} · {classLabel}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href={`/parent/fees?studentId=${selected.studentId}`}>
              <span style={{ display: "inline-block", background: "#fff", border: "1px solid var(--par-border)", borderRadius: 9, padding: "11px 18px", fontSize: 14, fontWeight: 600, color: "var(--par-ink)" }}>Pay fees</span>
            </Link>
            <Link href={`/parent/messages?studentId=${selected.studentId}`}>
              <span style={{ display: "inline-block", background: "var(--par-primary)", color: "#fff", borderRadius: 9, padding: "11px 18px", fontSize: 14, fontWeight: 700 }}>Message teacher</span>
            </Link>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 24 }}>
          <Link href={`/parent/attendance?studentId=${selected.studentId}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="parent-card-hover" style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 24, cursor: "pointer" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--par-ink)", marginBottom: 22 }}>Attendance</div>
              <div style={{ fontSize: 40, fontWeight: 800, color: "var(--par-ink)", lineHeight: 1, marginBottom: 14 }}>{attendance?.summary.percentage != null ? `${attendance.summary.percentage}%` : "—"}</div>
              <div style={{ fontSize: 14, marginBottom: 16 }}>
                <span style={{ fontWeight: 700, color: "var(--par-primary)" }}>{attendance?.summary.presentCount ?? 0}</span>
                <span style={{ color: "var(--par-body-muted)" }}> present this month</span>
              </div>
              <div style={{ height: 8, background: "var(--par-divider)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ width: `${attendance?.summary.percentage ?? 0}%`, height: "100%", background: "var(--par-primary)" }} />
              </div>
              <div style={{ fontSize: 13, color: "var(--par-tertiary)" }}>{attendance && attendance.summary.percentage != null ? `${attendance.summary.totalCount} days · ${attendance.summary.percentage}% present` : "No data yet"}</div>
            </div>
          </Link>

          <Link href={`/parent/fees?studentId=${selected.studentId}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="parent-card-hover" style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 24, cursor: "pointer" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--par-ink)", marginBottom: 22 }}>Fees pending</div>
              <div style={{ fontSize: 40, fontWeight: 800, color: "var(--par-ink)", lineHeight: 1, marginBottom: 14 }}>{feeSummary ? rupees(feeSummary.outstandingPaise) : "—"}</div>
              <div style={{ fontSize: 14, marginBottom: 16 }}>
                {feeSummary && Number(feeSummary.outstandingPaise) > 0 ? (
                  <span style={{ fontWeight: 700, color: "var(--par-red)" }}>Payment pending</span>
                ) : (
                  <span style={{ color: "var(--par-body-muted)" }}>{feeSummary ? "Fully paid" : "No fee terms yet"}</span>
                )}
              </div>
              <div style={{ height: 8, background: "var(--par-divider)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ width: feeSummary && Number(feeSummary.totalPayablePaise) > 0 ? `${Math.round((Number(feeSummary.paidPaise) / Number(feeSummary.totalPayablePaise)) * 100)}%` : "0%", height: "100%", background: "var(--par-primary)" }} />
              </div>
              <div style={{ fontSize: 13, color: "var(--par-tertiary)" }}>{feeSummary ? `${rupees(feeSummary.paidPaise)} paid of ${rupees(feeSummary.totalPayablePaise)}` : "—"}</div>
            </div>
          </Link>

          <Link href={`/parent/homework?studentId=${selected.studentId}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="parent-card-hover" style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 24, cursor: "pointer" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--par-ink)", marginBottom: 22 }}>Homework pending</div>
              <div style={{ fontSize: 40, fontWeight: 800, color: "var(--par-ink)", lineHeight: 1, marginBottom: 14 }}>{pendingHomework.length}</div>
              <div style={{ fontSize: 14, marginBottom: 16 }}>
                <span style={{ fontWeight: 700, color: "var(--par-ink)" }}>{dueToday.length}</span>
                <span style={{ color: "var(--par-body-muted)" }}> due today</span>
              </div>
              <div style={{ height: 8, background: "var(--par-divider)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ width: homework.length > 0 ? `${Math.round(((homework.length - pendingHomework.length) / homework.length) * 100)}%` : "0%", height: "100%", background: "var(--par-primary)" }} />
              </div>
              <div style={{ fontSize: 13, color: "var(--par-tertiary)" }}>{homework.length} total this term</div>
            </div>
          </Link>

          <Link href={`/parent/results?studentId=${selected.studentId}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="parent-card-hover" style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 24, cursor: "pointer" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--par-ink)", marginBottom: 22 }}>Latest exam average</div>
              <div style={{ fontSize: 40, fontWeight: 800, color: "var(--par-ink)", lineHeight: 1, marginBottom: 14 }}>{latestResult?.percent !== null && latestResult?.percent !== undefined ? `${latestResult.percent}%` : "—"}</div>
              <div style={{ fontSize: 14, marginBottom: 16 }}>
                {latestResult?.percent !== null && latestResult?.percent !== undefined ? (
                  <span style={{ fontWeight: 700, color: "var(--par-primary)" }}>Grade {gradeFor(latestResult.percent)}</span>
                ) : (
                  <span style={{ color: "var(--par-body-muted)" }}>Not published yet</span>
                )}
              </div>
              <div style={{ height: 8, background: "var(--par-divider)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ width: `${latestResult?.percent ?? 0}%`, height: "100%", background: "var(--par-primary)" }} />
              </div>
              <div style={{ fontSize: 13, color: "var(--par-tertiary)" }}>{latestExam ? latestExam.examName : "No exams published yet"}</div>
            </div>
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--par-ink)" }}>Today&rsquo;s timetable</div>
              <Link href={`/parent/timetable?studentId=${selected.studentId}`} style={{ fontSize: 13, fontWeight: 700 }}>Full week</Link>
            </div>
            {todaysSlots.length === 0 && <div style={{ fontSize: 13.5, color: "var(--par-tertiary)", padding: "12px 0" }}>No periods scheduled today.</div>}
            {todaysSlots.map((p) => {
              const isNow = nowMinutes >= toMinutes(p.startTime) && nowMinutes < toMinutes(p.endTime);
              return (
                <div key={p.slotId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: "1px solid var(--par-divider)" }}>
                  <div style={{ width: 56, flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--par-ink)" }}>{p.startTime.slice(0, 5)}</div>
                    <div style={{ fontSize: 11, color: "var(--par-tertiary)" }}>P{p.periodNo}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--par-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.subjectName}</div>
                    <div style={{ fontSize: 12, color: "var(--par-body-muted)" }}>{p.teacherName ?? "—"}</div>
                  </div>
                  {isNow && <span style={{ fontSize: 11, fontWeight: 700, background: "var(--par-primary)", color: "#fff", padding: "3px 9px", borderRadius: 16, flexShrink: 0 }}>NOW</span>}
                </div>
              );
            })}
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--par-ink)" }}>Needs attention</div>
              <span style={{ fontSize: 12, fontWeight: 700, background: "var(--par-tint)", color: "var(--par-primary)", padding: "4px 10px", borderRadius: 20 }}>{attentionItems.length} flags</span>
            </div>
            {attentionItems.length === 0 && <div style={{ fontSize: 13.5, color: "var(--par-tertiary)", padding: "12px 0" }}>Nothing needs attention right now.</div>}
            {attentionItems.map((a, i) => (
              <Link key={i} href={a.href} style={{ display: "flex", gap: 10, padding: "11px 0", borderBottom: "1px solid var(--par-divider)", textDecoration: "none", color: "inherit" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--par-primary)", flexShrink: 0, marginTop: 6 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--par-ink)" }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: "var(--par-body-muted)" }}>{a.subtitle}</div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--par-ink)" }}>Notices</div>
              <Link href={`/parent/notices?studentId=${selected.studentId}`}>
                <span style={{ display: "inline-block", background: "var(--par-primary)", color: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700 }}>View all</span>
              </Link>
            </div>
            {notices.length === 0 && <div style={{ fontSize: 13.5, color: "var(--par-tertiary)", padding: "12px 0" }}>No notices yet.</div>}
            {notices.slice(0, 3).map((n) => (
              <Link key={n.id} href={`/parent/notices?studentId=${selected.studentId}`} style={{ display: "block", padding: "11px 0", borderBottom: "1px solid var(--par-divider)", textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, background: "var(--par-tint)", color: "var(--par-primary)", padding: "3px 8px", borderRadius: 5, textTransform: "uppercase", letterSpacing: "0.03em" }}>{n.category ?? "Notice"}</span>
                  <span style={{ fontSize: 11, color: "var(--par-tertiary)" }}>{new Date(n.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--par-ink)" }}>{n.title}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load your dashboard."} />;
  }
}
