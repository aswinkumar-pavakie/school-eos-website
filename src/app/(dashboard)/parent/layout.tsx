import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ParentShell } from "@/components/parent-ui/ParentShell";
import { ACCESS_TOKEN_COOKIE, getCurrentActor } from "@/lib/api";
import { getFeeSummary, listChildren, listFeeTerms, listHomework } from "@/lib/parent-api";
import { EmptyState } from "@/components/ui/EmptyState";
import { E2eeBootstrapMount } from "@/lib/e2ee/E2eeBootstrapMount";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";

interface MeResponse {
  data: { person: { id: string; firstName: string; lastName: string | null } };
}

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) redirect("/login");

  const actor = await getCurrentActor().catch(() => null);
  if (!actor || !actor.roles.includes("PARENT")) redirect("/login");

  const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const me = meRes.ok ? ((await meRes.json()) as MeResponse) : null;
  const personName = me ? [me.data.person.firstName, me.data.person.lastName].filter(Boolean).join(" ") : "";

  const kids = await listChildren().catch(() => []);
  if (kids.length === 0) {
    return <EmptyState title="No children linked" body="This account has no linked students yet." />;
  }

  // Real pending-homework count across every linked child, for the
  // sidebar's "Daily Tasks" badge -- the design's own real badge source
  // (never a fabricated unread count).
  const homeworkCounts = await Promise.all(
    kids.map((k) =>
      listHomework(k.studentId)
        .then((rows) => rows.filter((h) => h.submissionStatus === "PENDING" || h.submissionStatus === "NOT_DONE").length)
        .catch(() => 0),
    ),
  );
  const homeworkPendingCount = homeworkCounts.reduce((sum, n) => sum + n, 0);

  // Real overdue-installment count across every linked child's latest fee
  // term, for the sidebar's "Fees" badge -- each child's own most recent
  // term only (not every term ever billed), same real signal the Fees page
  // itself surfaces per line.
  const childTerms = await Promise.all(kids.map((k) => listFeeTerms(k.studentId).catch(() => [])));
  const feesOverdueCounts = await Promise.all(
    kids.map(async (k, i) => {
      const latest = childTerms[i]![childTerms[i]!.length - 1];
      if (!latest) return 0;
      const summary = await getFeeSummary(k.studentId, latest.academicYearId, latest.instalmentNo).catch(() => null);
      return summary ? summary.lines.filter((l) => l.state === "OVERDUE").length : 0;
    }),
  );
  const feesOverdueCount = feesOverdueCounts.reduce((sum, n) => sum + n, 0);

  // Real "Term" pill -- the same fee_demand.instalment_no-derived label the
  // Fees page itself already shows (see parent-fee.repository.ts's own
  // header note: no literal term/semester table exists), taken from the
  // first linked child's own latest real term. Never a hardcoded literal.
  const firstChildTerms = childTerms[0] ?? [];
  const termLabel = firstChildTerms[firstChildTerms.length - 1]?.label ?? "";

  const now = new Date();
  const academicYearLabel = now.getMonth() >= 5 ? `${now.getFullYear()}–${String(now.getFullYear() + 1).slice(2)}` : `${now.getFullYear() - 1}–${String(now.getFullYear()).slice(2)}`;

  return (
    <>
      <E2eeBootstrapMount personId={actor.personId} />
      <ParentShell
        personName={personName}
        childOptions={kids.map((k) => ({ studentId: k.studentId, studentName: k.studentName, gradeName: k.gradeName, sectionName: k.sectionName }))}
        academicYearLabel={academicYearLabel}
        termLabel={termLabel}
        homeworkPendingCount={homeworkPendingCount}
        feesOverdueCount={feesOverdueCount}
      >
        {children}
      </ParentShell>
    </>
  );
}
