// Matches the mobile app's own Appraisal screen exactly (app/(protected)/
// faculty/appraisal.tsx): one flat page (no Apply/History tab split, which
// doesn't exist in the real feature), a "Submit self-assessment" trigger,
// and a "MY APPRAISALS" list showing state, score and Principal remark once
// reviewed. Real data via listAppraisals/createAppraisalAction, unchanged.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listAppraisals } from "@/lib/faculty-staff-api";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { AppraisalPageClient } from "./AppraisalPageClient";

export default async function AppraisalPage() {
  try {
    const appraisals = await listAppraisals();

    return (
      <div>
        <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Appraisal</h1>
        <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>Self-assessment &amp; review</p>

        <AppraisalPageClient />

        <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", margin: "22px 0 12px" }}>MY APPRAISALS</div>
        {appraisals.length === 0 ? (
          <FacultyEmptyState message="No appraisals submitted yet." />
        ) : (
          <div className="flex flex-col gap-3.5">
            {appraisals.map((a) => (
              <div key={a.id} className="fac-hover-lift" style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "20px 22px" }}>
                <div className="flex items-start justify-between gap-3">
                  <div style={{ font: "700 19px/1.3 var(--fac-font-sans)" }}>Cycle {a.cycle}</div>
                  <span style={{ font: "600 11.5px/1 var(--fac-font-sans)", letterSpacing: ".06em", borderRadius: 20, padding: "7px 13px", background: a.state === "REVIEWED" ? "var(--fac-tint)" : "var(--fac-divider)", color: a.state === "REVIEWED" ? "var(--fac-primary)" : "var(--fac-body)" }}>
                    {a.state === "REVIEWED" ? "Reviewed" : "Submitted"}
                  </span>
                </div>
                <p style={{ font: "400 14.5px/1.5 var(--fac-font-sans)", color: "var(--fac-body)", marginTop: 8 }}>{a.selfAssessment}</p>
                {a.state === "REVIEWED" && (a.score !== null || a.principalRemark) && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--fac-divider)" }}>
                    {a.score !== null && <p style={{ font: "600 15px/1.4 var(--fac-font-sans)" }}>Score: <span className="fac-font-mono">{a.score}</span></p>}
                    {a.principalRemark && <p style={{ font: "400 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 4 }}>{a.principalRemark}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your appraisals. Nothing was changed -- try again." />;
  }
}
