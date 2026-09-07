import { redirect } from "next/navigation";
import Link from "next/link";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { getMember, listFines, listIssues } from "@/lib/library-api";
import { formatDate, formatMoneySummary, statusLabel, statusTone } from "@/lib/format";
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

    return (
      <div className="mx-auto max-w-[900px]">
        <BackLink href="/library/members" label="Back to Members" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold leading-[34px] text-text">
              {member.firstName} {member.lastName ?? ""}
            </h1>
            <p className="mt-1.5 text-sm text-text-muted">
              {member.memberType}
              {member.identifier && ` · ${member.identifier}`}
              {member.gradeName && ` · ${member.gradeName}${member.sectionName ? ` · Section ${member.sectionName}` : ""}`}
              {` · Max ${member.maxBooksAllowed} books`}
            </p>
            <p className="mt-0.5 font-mono text-xs text-text-muted">Member ID {member.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <StatusPill tone={statusTone(member.status)} label={statusLabel(member.status)} />
        </div>
        {member.status === "SUSPENDED" && member.suspendedReason && (
          <p className="mt-2 text-sm text-critical-text">Suspended: {member.suspendedReason}</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-[14px] sm:grid-cols-2">
          <div className="rounded-[14px] border border-border bg-surface p-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">Active issues</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-text">{member.activeIssuesCount}</p>
          </div>
          <div className="rounded-[14px] border border-border bg-surface p-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-text-muted">Pending fines</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-text">{formatMoneySummary(member.pendingFinesAmountPaise)}</p>
          </div>
        </div>

        <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Actions</h2>
          <div className="mt-3">
            <MemberActions member={member} />
          </div>
        </section>

        <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Currently borrowed</h2>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {currentlyBorrowed.length === 0 && <li className="py-3 text-sm text-text-muted">Nothing currently borrowed.</li>}
            {currentlyBorrowed.map((issue) => (
              <li key={issue.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <Link href={`/library/circulation?search=${encodeURIComponent(issue.bookTitle)}`} className="truncate font-semibold text-text hover:text-primary">
                    {issue.bookTitle}
                  </Link>
                  <p className="text-xs text-text-muted">
                    {issue.copyCode} · issued {formatDate(issue.issuedAt)} · due {formatDate(issue.dueDate)}
                    {issue.isOverdue && ` · ${issue.daysOverdue}d overdue`}
                  </p>
                </div>
                <StatusPill tone={statusTone(issue.status)} label={statusLabel(issue.status)} />
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">History</h2>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {history.length === 0 && <li className="py-3 text-sm text-text-muted">No past issues for this member.</li>}
            {history.map((issue) => (
              <li key={issue.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text">{issue.bookTitle}</p>
                  <p className="text-xs text-text-muted">
                    {issue.copyCode} · issued {formatDate(issue.issuedAt)} · due {formatDate(issue.dueDate)}
                    {issue.returnedAt && ` · returned ${formatDate(issue.returnedAt)}`}
                  </p>
                </div>
                <StatusPill tone={statusTone(issue.status)} label={statusLabel(issue.status)} />
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-[16px] border border-border bg-surface p-[18px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Fines</h2>
            <Link href={`/library/fines?memberId=${id}`} className="text-[13px] font-semibold text-primary">View in Fines</Link>
          </div>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {fines.length === 0 && <li className="py-3 text-sm text-text-muted">No fines assessed for this member.</li>}
            {fines.map((fine) => (
              <li key={fine.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p className="font-semibold text-text">{fine.reason} · {formatMoneySummary(fine.amountPaise)}</p>
                  <p className="text-xs text-text-muted">Assessed {formatDate(fine.assessedAt)}</p>
                </div>
                <StatusPill tone={statusTone(fine.status)} label={statusLabel(fine.status)} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this member</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }
}
