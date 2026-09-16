// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isEmpPayslip"
// screen (nav label "Payslip"). Reuses EXISTING real
// getPayslipRequestStatus/listPayslips/requestPayslipAccessAction unchanged.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { getPayslipRequestStatus, listPayslips } from "@/lib/faculty-staff-api";
import { formatMoneyDetail } from "@/lib/format";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { RequestAccessButtonPixel } from "./RequestAccessButtonPixel";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default async function PayslipPage() {
  try {
    const status = await getPayslipRequestStatus();

    return (
      <div>
        <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Payslip request</h1>
        <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
          Gated by request -- Principal, then Finance. Once approved, access stays granted.
        </p>

        {!status.hasAccess ? (
          <div style={{ marginTop: 22 }}>
            <div style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: 22 }}>
              <p style={{ font: "700 16px/1.3 var(--fac-font-sans)" }}>Payslip access required</p>
              <p style={{ font: "400 14px/1.5 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 6 }}>
                Request access to view your payslips. This goes to the Principal, then Finance for approval.
              </p>
              {!status.requests.some((r) => r.state === "PENDING") && (
                <div style={{ marginTop: 16 }}>
                  <RequestAccessButtonPixel />
                </div>
              )}
            </div>

            {status.requests.length > 0 && (
              <div className="flex flex-col gap-3.5" style={{ marginTop: 18 }}>
                {status.requests.map((r) => (
                  <div key={r.id} className="fac-hover-lift flex items-center justify-between gap-3" style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "16px 20px" }}>
                    <span style={{ font: "600 14.5px/1.3 var(--fac-font-sans)" }}>{r.subject}</span>
                    <span style={{ font: "600 11.5px/1 var(--fac-font-sans)", letterSpacing: ".06em", borderRadius: 20, padding: "7px 13px", background: "var(--fac-divider)", color: "var(--fac-body)" }}>{r.state}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <PayslipList />
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your payslip access. Nothing was changed -- try again." />;
  }
}

async function PayslipList() {
  const payslips = await listPayslips();
  if (payslips.length === 0) {
    return (
      <div style={{ marginTop: 22 }}>
        <FacultyEmptyState message="Access is approved -- no payslip has been processed yet." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3" style={{ marginTop: 22 }}>
      {payslips.map((p) => (
        <details key={p.id} className="fac-hover-lift" style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "18px 20px" }}>
          <summary className="flex cursor-pointer items-center justify-between gap-4" style={{ listStyle: "none" }}>
            <span style={{ font: "700 16px/1.3 var(--fac-font-sans)" }}>{MONTH_NAMES[p.month - 1]} {p.year}</span>
            <span className="fac-font-mono" style={{ font: "600 15px/1 var(--fac-font-mono)", color: "var(--fac-green-text)" }}>{formatMoneyDetail(p.netPaise)}</span>
          </summary>
          <div className="flex flex-col gap-1.5" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--fac-divider)" }}>
            <div className="flex justify-between"><span style={{ color: "var(--fac-body-muted)" }}>Gross</span><span className="fac-font-mono">{formatMoneyDetail(p.grossPaise)}</span></div>
            <div className="flex justify-between"><span style={{ color: "var(--fac-body-muted)" }}>Deductions</span><span className="fac-font-mono">{formatMoneyDetail(p.deductionsPaise)}</span></div>
          </div>
        </details>
      ))}
    </div>
  );
}
