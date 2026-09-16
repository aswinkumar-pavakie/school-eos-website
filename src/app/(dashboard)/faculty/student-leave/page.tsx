// Pixel-rebuilt to match Class Teacher Portal.dc.html's "isLeave" screen
// (nav label "Approve leave"). Reuses the EXISTING approveAction server
// action unchanged; only presentation is rebuilt.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { listStudentLeaveRequests } from "@/lib/faculty-api";
import { Tabs } from "@/components/faculty-ui/Tabs";
import { FacultyEmptyState } from "@/components/faculty-ui/EmptyState";
import { approveAction } from "./actions";
import { FacultyRejectModal } from "./FacultyRejectModal";

export default async function StudentLeavePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  try {
    const requests = await listStudentLeaveRequests();
    const { tab } = await searchParams;
    const activeTab = tab === "APPROVED" || tab === "REJECTED" ? tab : "PENDING";

    const counts = {
      PENDING: requests.filter((r) => r.state === "PENDING").length,
      APPROVED: requests.filter((r) => r.state === "APPROVED").length,
      REJECTED: requests.filter((r) => r.state === "REJECTED").length,
    };
    const filtered = requests.filter((r) => r.state === activeTab);

    return (
      <div>
        <h1 style={{ margin: 0, font: "700 36px/1.1 var(--fac-font-sans)", letterSpacing: "-.02em" }}>Approve leave</h1>
        <p style={{ margin: "8px 0 0", font: "400 15px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)" }}>
          Leave requests raised by parents of your section
        </p>

        <div style={{ marginTop: 22 }}>
          <Tabs
            items={[
              { key: "PENDING", label: `Pending (${counts.PENDING})`, href: "/faculty/student-leave?tab=PENDING" },
              { key: "APPROVED", label: `Approved (${counts.APPROVED})`, href: "/faculty/student-leave?tab=APPROVED" },
              { key: "REJECTED", label: `Rejected (${counts.REJECTED})`, href: "/faculty/student-leave?tab=REJECTED" },
            ]}
            activeKey={activeTab}
          />
        </div>

        {filtered.length === 0 ? (
          <div style={{ marginTop: 18 }}>
            <FacultyEmptyState message="No requests in this list." />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2" style={{ marginTop: 18 }}>
            {filtered.map((r) => (
              <div
                key={r.id}
                className="fac-hover-lift"
                style={{ background: "var(--fac-white)", border: "1px solid var(--fac-border)", borderRadius: "var(--fac-radius-card)", padding: "20px 22px" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div style={{ font: "700 18px/1.2 var(--fac-font-sans)" }}>{r.studentName}</div>
                    <div style={{ font: "400 13px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 3 }}>
                      Roll {r.rollNo ?? "--"}{r.gradeName ? ` · ${r.gradeName}-${r.sectionName}` : ""}
                    </div>
                  </div>
                  <span
                    style={{
                      font: "600 12px/1 var(--fac-font-sans)",
                      borderRadius: 20,
                      padding: "7px 13px",
                      background: r.state === "APPROVED" ? "var(--fac-tint)" : r.state === "REJECTED" ? "var(--fac-red-bg)" : "var(--fac-divider)",
                      color: r.state === "APPROVED" ? "var(--fac-primary)" : r.state === "REJECTED" ? "var(--fac-red-text)" : "var(--fac-body)",
                    }}
                  >
                    {r.state}
                  </span>
                </div>
                <div style={{ font: "400 15px/1.5 var(--fac-font-sans)", color: "var(--fac-body)", marginTop: 14 }}>{r.reason}</div>
                <div style={{ font: "400 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-body-muted)", marginTop: 9 }}>
                  {new Date(r.fromDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} &ndash;{" "}
                  {new Date(r.toDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </div>
                {r.attachmentFileName && (
                  <div style={{ font: "500 13.5px/1.4 var(--fac-font-sans)", color: "var(--fac-primary)", marginTop: 7 }}>{r.attachmentFileName}</div>
                )}
                {r.state === "PENDING" && r.approvalRequestId && (
                  <div className="flex gap-3" style={{ marginTop: 16 }}>
                    <form action={approveAction.bind(null, r.approvalRequestId)} style={{ flex: 1 }}>
                      <button
                        type="submit"
                        style={{ width: "100%", border: 0, background: "var(--fac-primary)", color: "#fff", cursor: "pointer", font: "600 14.5px/1 var(--fac-font-sans)", borderRadius: 10, padding: 13 }}
                      >
                        Approve
                      </button>
                    </form>
                    <FacultyRejectModal approvalRequestId={r.approvalRequestId} />
                  </div>
                )}
                {r.decidedAt && (
                  <div style={{ font: "400 12.5px/1.4 var(--fac-font-sans)", color: "var(--fac-tertiary)", marginTop: 10 }}>
                    Decided on {new Date(r.decidedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
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
    return <ErrorState message="Couldn't load student leave requests. Nothing was changed -- try again." />;
  }
}
