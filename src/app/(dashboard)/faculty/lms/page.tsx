// Pixel-rebuilt entry point matching Class Teacher Portal.dc.html's
// "isTerm" screen's top card grid ("ctCards"). Reuses the EXISTING real
// listLmsSubjects() data and route structure (/faculty/lms/[subjectId] and
// its folder/task/assignment sub-pages) unchanged -- those nested pages keep
// their current UI for now (not yet reskinned in this pass; real, working,
// just not pixel-matched to the new design yet).

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listLmsSubjects } from "@/lib/faculty-lms-api";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";

export default async function LmsSubjectsPage() {
  try {
    const subjects = await listLmsSubjects();

    return (
      <div>
        <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Current term</h1>
        <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
          My subjects · one folder per subject, shared across every class you teach it to
        </p>

        {subjects.length === 0 ? (
          <div style={{ marginTop: 22 }}>
            <FacultyEmptyState message="You are not assigned to teach any subject." />
          </div>
        ) : (
          <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginTop: 22 }}>
            {subjects.map((s) => (
              <a
                key={s.subjectId}
                href={`/faculty/lms/${s.subjectId}`}
                className="fac-hover-lift block"
                style={{ border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "16px 18px", background: "var(--fac-white)" }}
              >
                <span className="flex items-start gap-3.5">
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--fac-tint)", color: "var(--fac-primary)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 12.5px/1 var(--fac-font-sans)", flex: "0 0 38px" }}>
                    {s.subjectName.slice(0, 2).toUpperCase()}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", font: "700 17px/1.25 var(--fac-font-sans)" }}>{s.subjectName}</span>
                    <span style={{ display: "block", font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>
                      {s.classes.map((c) => `${c.gradeName}-${c.sectionName}`).join(", ")}
                    </span>
                  </span>
                </span>
                <span className="flex items-center justify-between" style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--fac-border)" }}>
                  <span style={{ font: "600 13.5px/1 var(--fac-font-sans)", color: "var(--fac-body)" }}>{s.classes.length} class{s.classes.length === 1 ? "" : "es"}</span>
                  <span style={{ font: "500 13.5px/1 var(--fac-font-sans)", color: "var(--fac-primary)" }}>Open folder &rarr;</span>
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load Current Term. Nothing was changed -- try again." />;
  }
}
