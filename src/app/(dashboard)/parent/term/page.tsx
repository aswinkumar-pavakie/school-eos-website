// Current term -- pixel-rebuilt from the design's own isAcademics screen.
// Real subject_offering data (listCurrentTerm), same
// /parent/students/:id/current-term endpoint already established.

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/parent-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { orDash } from "@/lib/format";
import { listChildren, listCurrentTerm, resolveSelectedChild } from "@/lib/parent-api";

export default async function ParentTermPage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const subjects = await listCurrentTerm(selected.studentId);

    return (
      <div className="parent-scope">
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6, color: "var(--par-ink)" }}>Current term</div>
          <div style={{ fontSize: 15, color: "var(--par-body-muted)" }}>{selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join("-")}</div>
        </div>

        {subjects.length === 0 ? (
          <EmptyPanel label="Subjects will appear here once this term's offerings are set up." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 16 }}>
            {subjects.map((s) => (
              <Link key={s.subjectOfferingId} href={`/parent/term/${s.subjectOfferingId}?studentId=${selected.studentId}`} className="parent-card-hover" style={{ display: "block", background: "#fff", border: "1px solid var(--par-border)", borderRadius: 14, padding: 18, textDecoration: "none" }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: "var(--par-tint)", color: "var(--par-primary)", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  {s.subjectName.slice(0, 3).toUpperCase()}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--par-ink)" }}>{s.subjectName}</div>
                <div style={{ fontSize: 12.5, color: "var(--par-body-muted)", marginTop: 4 }}>
                  {orDash(s.teacherName)}
                  {s.weeklyPeriods !== null ? ` · ${s.weeklyPeriods} periods/week` : ""}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load the current term."} />;
  }
}
