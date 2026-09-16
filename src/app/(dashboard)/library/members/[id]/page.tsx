// Member detail (no-dues status) -- the design's own Members list hints at
// this ("Click a row to check no-dues status") but has no screen of its own
// for it. Reskinned to the rebuild's tokens for visual consistency;
// MemberActions (suspend/reactivate/edit max books, already real and
// working) is left as-is, same reasoning as the book detail page's own
// CopyRowActions.

import { redirect } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/dashboard/BackLink";
import { AuthExpiredError } from "@/lib/api";
import { getMember, listFines, listIssues } from "@/lib/library-api";
import { formatDate, formatMoneySummary } from "@/lib/format";
import { Pill } from "@/components/library-ui/primitives";
import { MemberActions } from "./MemberActions";

export default async function LibraryMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const [member, { data: issues }, { data: fines }] = await Promise.all([
      getMember(id),
      listIssues({ memberId: id, limit: 100 }),
      listFines({ memberId: id, limit: 100 }),
    ]);
    const currentlyBorrowed = issues.filter((i) => i.status === "ISSUED" || i.status === "OVERDUE");
    const history = issues.filter((i) => i.status !== "ISSUED" && i.status !== "OVERDUE");
    const noDues = currentlyBorrowed.length === 0 && Number(member.pendingFinesAmountPaise) === 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 900 }}>
        <BackLink href="/library/members" label="Back to Library members" />
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h1 style={{ margin: 0, font: "700 38px/1.15 var(--lib-font-sans)" }}>{member.firstName} {member.lastName ?? ""}</h1>
            <div style={{ font: "400 16px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
              {member.memberType === "STUDENT" ? "Student" : "Staff"}
              {member.identifier && ` · ${member.identifier}`}
              {member.gradeName && ` · ${member.gradeName}${member.sectionName ? ` · ${member.sectionName}` : ""}`}
              {` · Max ${member.maxBooksAllowed} books`}
            </div>
          </div>
          <Pill label={noDues ? "No dues" : member.status === "SUSPENDED" ? "Suspended" : "Has dues"} tone={noDues ? "green" : member.status === "SUSPENDED" ? "red" : "amber"} />
        </div>
        {member.status === "SUSPENDED" && member.suspendedReason && (
          <p style={{ margin: 0, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-red)" }}>Suspended: {member.suspendedReason}</p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
          <div style={{ border: "1px solid var(--lib-border)", borderRadius: 14, padding: 16, textAlign: "center" }}>
            <p style={{ margin: 0, font: "700 11px/1.4 var(--lib-font-sans)", letterSpacing: ".09em", textTransform: "uppercase", color: "var(--lib-body-muted)" }}>Currently borrowed</p>
            <p className="lib-font-mono" style={{ margin: "6px 0 0", font: "700 24px/1 var(--lib-font-mono)", color: "var(--lib-ink)" }}>{member.activeIssuesCount}</p>
          </div>
          <div style={{ border: "1px solid var(--lib-border)", borderRadius: 14, padding: 16, textAlign: "center" }}>
            <p style={{ margin: 0, font: "700 11px/1.4 var(--lib-font-sans)", letterSpacing: ".09em", textTransform: "uppercase", color: "var(--lib-body-muted)" }}>Pending fines</p>
            <p className="lib-font-mono" style={{ margin: "6px 0 0", font: "700 24px/1 var(--lib-font-mono)", color: "var(--lib-ink)" }}>{formatMoneySummary(member.pendingFinesAmountPaise)}</p>
          </div>
        </div>

        <section style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", padding: 18 }}>
          <h2 style={{ margin: 0, font: "600 15px/1.3 var(--lib-font-sans)" }}>Actions</h2>
          <div style={{ marginTop: 12 }}>
            <MemberActions member={member} />
          </div>
        </section>

        <section style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", padding: 18 }}>
          <h2 style={{ margin: 0, font: "600 15px/1.3 var(--lib-font-sans)" }}>Currently borrowed</h2>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
            {currentlyBorrowed.length === 0 && <p style={{ margin: 0, padding: "10px 0", font: "400 14px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing currently borrowed.</p>}
            {currentlyBorrowed.map((issue) => (
              <div key={issue.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: "1px solid var(--lib-divider)" }}>
                <div style={{ minWidth: 0 }}>
                  <Link href={`/library/returns?search=${encodeURIComponent(issue.bookTitle)}`} className="lib-link-hover" style={{ font: "600 14px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>
                    {issue.bookTitle}
                  </Link>
                  <p style={{ margin: 0, font: "400 12.5px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
                    {issue.copyCode} · issued {formatDate(issue.issuedAt)} · due {formatDate(issue.dueDate)}
                    {issue.isOverdue && ` · ${issue.daysOverdue}d overdue`}
                  </p>
                </div>
                <Pill label={issue.status === "OVERDUE" ? "Overdue" : "Borrowed"} />
              </div>
            ))}
          </div>
        </section>

        <section style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", padding: 18 }}>
          <h2 style={{ margin: 0, font: "600 15px/1.3 var(--lib-font-sans)" }}>History</h2>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
            {history.length === 0 && <p style={{ margin: 0, padding: "10px 0", font: "400 14px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>No past issues for this member.</p>}
            {history.map((issue) => (
              <div key={issue.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: "1px solid var(--lib-divider)" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, font: "600 14px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{issue.bookTitle}</p>
                  <p style={{ margin: 0, font: "400 12.5px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
                    {issue.copyCode} · issued {formatDate(issue.issuedAt)}{issue.returnedAt && ` · returned ${formatDate(issue.returnedAt)}`}
                  </p>
                </div>
                <Pill label={issue.status === "ISSUED" ? "Borrowed" : issue.status.charAt(0) + issue.status.slice(1).toLowerCase()} />
              </div>
            ))}
          </div>
        </section>

        <section style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, font: "600 15px/1.3 var(--lib-font-sans)" }}>Fines</h2>
            <Link href={`/library/fines?search=${encodeURIComponent(member.firstName)}`} className="lib-link-hover" style={{ font: "600 13px/1.2 var(--lib-font-sans)", color: "var(--lib-primary)" }}>
              View in Overdue &amp; fines
            </Link>
          </div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column" }}>
            {fines.length === 0 && <p style={{ margin: 0, padding: "10px 0", font: "400 14px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>No fines assessed for this member.</p>}
            {fines.map((fine) => (
              <div key={fine.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: "1px solid var(--lib-divider)" }}>
                <div>
                  <p style={{ margin: 0, font: "600 14px/1.3 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{fine.reason} · {formatMoneySummary(fine.amountPaise)}</p>
                  <p style={{ margin: 0, font: "400 12.5px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Assessed {formatDate(fine.assessedAt)}</p>
                </div>
                <Pill label={fine.status.charAt(0) + fine.status.slice(1).toLowerCase().replace(/_/g, " ")} />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", background: "var(--lib-white)", padding: 32, textAlign: "center" }}>
        <p style={{ font: "600 15px/1.3 var(--lib-font-sans)" }}>Couldn&apos;t load this member</p>
        <p style={{ marginTop: 6, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
