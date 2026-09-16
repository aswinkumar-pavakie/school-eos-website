// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isEmpPayroll"
// screen (nav label "HR payroll"). Reuses EXISTING real listHrRequests/
// createHrRequestAction unchanged.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listHrRequests } from "@/lib/faculty-staff-api";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { HrRequestForm } from "./HrRequestForm";

const CATEGORY_LABELS: Record<string, string> = {
  SALARY_QUERY: "Salary query",
  PF_ESI: "PF / ESI",
  INCOME_TAX_DECLARATION: "Income tax declaration",
  INCREMENT_ARREARS: "Increment / arrears",
  BANK_ACCOUNT_CHANGE: "Bank account change",
  SERVICE_CERTIFICATE: "Service certificate",
  PAYSLIP_REQUEST: "Payslip access",
};

export default async function HrRequestsPage() {
  try {
    const requests = await listHrRequests();

    return (
      <div>
        <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>HR payroll</h1>
        <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>Payroll and HR queries</p>

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_1.15fr]" style={{ marginTop: 22, alignItems: "start" }}>
          <HrRequestForm />
          <div>
            <div style={{ font: "600 11px/1 var(--fac-font-sans)", letterSpacing: ".09em", color: "var(--fac-tertiary)", marginBottom: 12 }}>REQUEST STATUS</div>
            {requests.length === 0 ? (
              <FacultyEmptyState message="Submit your first HR request." />
            ) : (
              <div className="flex flex-col gap-3.5">
                {requests.map((r) => {
                  const inReview = r.state !== "PENDING";
                  const resolved = r.state === "APPROVED" || r.state === "RESOLVED" || r.state === "REJECTED";
                  return (
                    <div key={r.id} className="fac-hover-lift" style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "20px 22px" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="fac-font-mono" style={{ font: "500 13px/1 var(--fac-font-mono)", color: "var(--fac-tertiary)" }}>{r.id.slice(0, 8).toUpperCase()}</div>
                        <span style={{ font: "600 11.5px/1 var(--fac-font-sans)", letterSpacing: ".06em", borderRadius: 20, padding: "7px 13px", background: resolved ? "var(--fac-tint)" : "var(--fac-divider)", color: resolved ? "var(--fac-primary)" : "var(--fac-body)" }}>
                          {r.state}
                        </span>
                      </div>
                      <div style={{ font: "700 18px/1.3 var(--fac-font-sans)", marginTop: 12 }}>{r.subject}</div>
                      <div style={{ font: "400 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 4 }}>{CATEGORY_LABELS[r.category] ?? r.category}</div>
                      <div className="grid grid-cols-3 gap-3" style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--fac-divider)" }}>
                        {[
                          { label: "SUBMITTED", on: true },
                          { label: "IN REVIEW", on: inReview },
                          { label: "RESOLVED", on: resolved },
                        ].map((s) => (
                          <div key={s.label}>
                            <span style={{ display: "block", width: 10, height: 10, borderRadius: "50%", background: "var(--fac-primary)", opacity: s.on ? 1 : 0.25 }} />
                            <div style={{ font: "600 10.5px/1 var(--fac-font-sans)", letterSpacing: ".08em", color: "var(--fac-tertiary)", marginTop: 10 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load HR requests. Nothing was changed -- try again." />;
  }
}
