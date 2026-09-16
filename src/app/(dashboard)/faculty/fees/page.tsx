// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isFees" screen.
// Real, live data (see faculty-fees-api.ts's own comment) -- degrades to
// GapNotice only if the request genuinely fails (e.g. not currently an
// advisor for any section), never fake data.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listAdvisorSections } from "@/lib/faculty-api";
import { getSectionFees } from "@/lib/faculty-fees-api";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { GapNotice } from "@/components/faculty-ui/GapNotice";
import { SendFeeNoticeForm } from "./SendFeeNoticeForm";

export default async function FeesPage() {
  try {
    const sections = await listAdvisorSections();
    const section = sections[0];

    return (
      <div>
        <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Fees</h1>
        <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
          Pending fees in your class -- remind a parent directly or all pending parents at once
        </p>

        <div style={{ marginTop: 22 }}>
          {!section ? (
            <FacultyEmptyState message="You are not a class advisor -- fees are only visible to the section's own class advisor." />
          ) : (
            <FeesSection sectionId={section.sectionId} sectionLabel={`${section.gradeName}-${section.sectionName}`} />
          )}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load fees. Nothing was changed -- try again." />;
  }
}

async function FeesSection({ sectionId, sectionLabel }: { sectionId: string; sectionLabel: string }) {
  try {
    const fees = await getSectionFees(sectionId);
    return (
      <div>
        <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "20px 22px" }}>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)" }}>PENDING IN CLASS {sectionLabel}</div>
              <div style={{ font: "700 27px/1.2 var(--fac-font-sans)", marginTop: 8 }}>
                {fees.studentsWithDues} of {fees.totalStudents} students have dues
              </div>
            </div>
            <div className="flex gap-3">
              {[
                { label: "OVERDUE", value: fees.overdueCount },
                { label: "DUE", value: fees.dueCount },
                { label: "PAID", value: fees.paidCount },
              ].map((t) => (
                <div key={t.label} style={{ background: "var(--fac-panel)", borderRadius: 10, padding: "12px 22px", textAlign: "center" }}>
                  <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)" }}>{t.label}</div>
                  <div style={{ font: "700 22px/1 var(--fac-font-sans)", color: "var(--fac-primary)", marginTop: 8 }}>{t.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <SendFeeNoticeForm sectionId={sectionId} sectionLabel={sectionLabel} studentsWithDues={fees.studentsWithDues} totalStudents={fees.totalStudents} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2" style={{ marginTop: 16 }}>
          {fees.rows.map((r) => (
            <div key={r.studentId} className="fac-hover-lift" style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "18px 20px" }}>
              <div className="flex items-center gap-3">
                <span style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--fac-tint)", color: "var(--fac-primary)", display: "flex", alignItems: "center", justifyContent: "center", font: "600 12.5px/1 var(--fac-font-sans)" }}>
                  {r.studentName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", font: "600 15.5px/1.3 var(--fac-font-sans)" }}>{r.studentName}</span>
                  <span style={{ display: "block", font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)" }}>
                    Roll {r.rollNo ?? "--"}{r.parentName ? ` · ${r.parentName}` : ""}
                  </span>
                </span>
                <span
                  style={{
                    font: "600 11.5px/1 var(--fac-font-sans)",
                    letterSpacing: ".06em",
                    borderRadius: 20,
                    padding: "7px 12px",
                    background: r.status === "OVERDUE" ? "var(--fac-red-bg)" : r.status === "PAID" ? "var(--fac-tint)" : "var(--fac-divider)",
                    color: r.status === "OVERDUE" ? "var(--fac-red-text)" : r.status === "PAID" ? "var(--fac-primary)" : "var(--fac-body)",
                  }}
                >
                  {r.status}
                </span>
              </div>
              <div style={{ background: "var(--fac-panel)", borderRadius: 10, padding: 14, marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)" }}>AMOUNT PENDING</div>
                  <div style={{ font: "700 23px/1.1 var(--fac-font-sans)", marginTop: 7 }}>&#8377;{r.amountPending.toLocaleString("en-IN")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ font: "600 13px/1 var(--fac-font-sans)", color: "var(--fac-primary)" }}>{r.term}</div>
                  <div style={{ font: "400 12.5px/1.3 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 5 }}>
                    Due {new Date(r.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } catch {
    return <GapNotice feature="Fee status for your class" />;
  }
}
