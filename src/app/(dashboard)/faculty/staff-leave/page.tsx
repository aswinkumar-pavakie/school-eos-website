// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isEmpLeave" screen.
// Reuses EXISTING real listStaffLeave/createStaffLeaveAction unchanged.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listStaffLeave } from "@/lib/faculty-staff-api";
import { Tabs } from "@/components/faculty-ui/Tabs";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { StaffLeaveForm } from "./StaffLeaveForm";

const LEAVE_LABELS: Record<string, string> = { CASUAL: "Casual leave", MEDICAL: "Medical leave", EARNED: "Earned leave" };

export default async function StaffLeavePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  try {
    const { tab } = await searchParams;
    const activeTab = tab === "History" ? "History" : "Apply";
    const requests = (await listStaffLeave()).filter((r) => r.leaveType !== "ON_DUTY");

    return (
      <div>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Staff leave</h1>
            <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
              Requests are routed to the academic coordinator, then the Principal&rsquo;s office
            </p>
          </div>
          <Tabs
            items={[
              { key: "Apply", label: "Apply", href: "/faculty/staff-leave?tab=Apply" },
              { key: "History", label: "History", href: "/faculty/staff-leave?tab=History" },
            ]}
            activeKey={activeTab}
          />
        </div>

        {activeTab === "Apply" ? (
          <StaffLeaveForm />
        ) : requests.length === 0 ? (
          <div style={{ marginTop: 18 }}>
            <FacultyEmptyState message="Nothing has been submitted yet." />
          </div>
        ) : (
          <div className="flex flex-col gap-3.5" style={{ marginTop: 18 }}>
            {requests.map((r) => {
              const lastStep = [...r.approvalTrail].reverse().find((s) => s.decision);
              return (
                <div key={r.id} className="fac-hover-lift" style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "20px 22px" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="fac-font-mono" style={{ font: "500 13px/1 var(--fac-font-mono)", color: "var(--fac-tertiary)" }}>{r.id.slice(0, 8).toUpperCase()}</div>
                    <span style={{ font: "600 11.5px/1 var(--fac-font-sans)", letterSpacing: ".06em", borderRadius: 20, padding: "7px 13px", background: r.state === "APPROVED" ? "var(--fac-tint)" : r.state === "REJECTED" ? "var(--fac-red-bg)" : "var(--fac-divider)", color: r.state === "APPROVED" ? "var(--fac-primary)" : r.state === "REJECTED" ? "var(--fac-red-text)" : "var(--fac-body)" }}>
                      {r.state}
                    </span>
                  </div>
                  <div style={{ font: "700 19px/1.3 var(--fac-font-sans)", marginTop: 12 }}>{LEAVE_LABELS[r.leaveType] ?? r.leaveType}</div>
                  <div style={{ font: "500 14.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body)", marginTop: 6 }}>
                    {new Date(r.fromDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} &ndash; {new Date(r.toDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </div>
                  <div style={{ font: "400 14.5px/1.5 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 6 }}>{r.reason}</div>
                  {lastStep && (
                    <div style={{ font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--fac-divider)" }}>
                      {lastStep.decision === "APPROVED" ? "Approved" : "Rejected"} by {lastStep.decidedByName ?? lastStep.approverRoleCode}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load your requests. Nothing was changed -- try again." />;
  }
}
