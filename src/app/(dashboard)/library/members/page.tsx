// Library members -- pixel-rebuilt from the design's own screen. Every
// column, including Total/Last borrowed, comes from the real
// LibraryMemberListRow the members endpoint returns.

import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthExpiredError } from "@/lib/api";
import { listEligibleMembers, listMemberGrades, listMembers } from "@/lib/library-api";
import { formatDate } from "@/lib/format";
import { AutoSubmitSearchInput, AutoSubmitSelect } from "@/components/dashboard/AutoSubmitFilter";
import { EmptyRow, Pill, TableShell, Td, Th } from "@/components/library-ui/primitives";
import { AddMemberModal } from "./AddMemberModal";

export default async function LibraryMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; gradeId?: string }>;
}) {
  const params = await searchParams;

  try {
    // Total/last borrowed come from the members query itself (real per-member
    // aggregates). They used to be tallied in the browser from just the newest
    // 200 of ~18,000 issue rows, so most members wrongly showed 0 total.
    const [{ data: members }, grades, eligiblePeople] = await Promise.all([
      listMembers({ search: params.search || undefined, gradeId: params.gradeId || undefined, status: "ACTIVE", limit: 200 }),
      listMemberGrades(),
      listEligibleMembers(),
    ]);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 style={{ margin: 0, font: "700 38px/1.15 var(--lib-font-sans)" }}>Library members</h1>
          <div style={{ font: "400 16px/1.5 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>
            Students, teachers and parents with a borrowing record — history, current borrowings and standing.
          </div>
        </div>

        <form action="/library/members" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240, maxWidth: 420, display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", border: "1px solid var(--lib-border)", borderRadius: 11 }}>
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="#94A3B8" strokeWidth={1.7}>
              <circle cx="9" cy="9" r="5.6" />
              <path d="M13.2 13.2L17 17" />
            </svg>
            <AutoSubmitSearchInput
              type="search"
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Search by name, roll number or class"
              style={{ flex: 1, border: 0, outline: "none", font: "400 15px/1.2 var(--lib-font-sans)", color: "var(--lib-ink)", background: "transparent" }}
            />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-primary)" }}>Click a row to check no-dues status</span>
            <AutoSubmitSelect
              name="gradeId"
              defaultValue={params.gradeId ?? ""}
              style={{ padding: "13px 14px", border: "1px solid var(--lib-border)", borderRadius: 10, font: "400 15px/1.2 var(--lib-font-sans)", background: "var(--lib-white)", minWidth: 170 }}
            >
              <option value="">All classes</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </AutoSubmitSelect>
          </div>
        </form>

        {/* The design has no "add member" affordance at all -- it assumes every
            student/teacher already IS a member. Real schema requires explicit
            registration first (POST /library/members), so this stays reachable
            as a small, secondary link rather than a big primary button, using
            the existing, already-working AddMemberModal as-is (untouched,
            functional, no design target of its own). */}
        <div>
          <AddMemberModal eligiblePeople={eligiblePeople} />
        </div>

        <TableShell>
          <thead>
            <tr style={{ background: "var(--lib-panel)" }}>
              <Th>Member</Th>
              <Th>Class / role</Th>
              <Th>Currently borrowed</Th>
              <Th>Total borrowed</Th>
              <Th>Last borrowed</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && <EmptyRow colSpan={6} />}
            {members.map((m) => {
              const overdue = m.overdueCount > 0;
              return (
                <tr key={m.id} className="lib-row-hover">
                  <Td style={{ padding: 0 }}>
                    <Link href={`/library/members/${m.id}`} style={{ display: "block", padding: "16px 18px", color: "inherit", textDecoration: "none" }}>
                      <div style={{ font: "600 15px/1.4 var(--lib-font-sans)", color: "var(--lib-ink)" }}>{m.firstName} {m.lastName ?? ""}</div>
                      <div className="lib-font-mono" style={{ font: "400 13px/1.5 var(--lib-font-mono)", color: "var(--lib-body-muted)" }}>{m.identifier ?? "—"}</div>
                    </Link>
                  </Td>
                  <Td>{m.gradeName ? `${m.gradeName}${m.sectionName ? ` · ${m.sectionName}` : ""}` : m.memberType === "STUDENT" ? "Student" : "Staff"}</Td>
                  <Td mono>{m.activeIssuesCount}</Td>
                  <Td mono>{m.totalIssuesCount}</Td>
                  <Td>{m.lastIssuedAt && m.lastIssueTitle ? `${m.lastIssueTitle} (${formatDate(m.lastIssuedAt)})` : "—"}</Td>
                  <Td>
                    <Pill label={overdue ? "Overdue" : "Clear"} tone={overdue ? "amber" : "green"} />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div style={{ border: "1px solid var(--lib-border)", borderRadius: "var(--lib-radius-card)", background: "var(--lib-white)", padding: 32, textAlign: "center" }}>
        <p style={{ font: "600 15px/1.3 var(--lib-font-sans)" }}>Couldn&apos;t load Library members</p>
        <p style={{ marginTop: 6, font: "400 14px/1.4 var(--lib-font-sans)", color: "var(--lib-body-muted)" }}>Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
