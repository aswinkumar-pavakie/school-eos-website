// Community -> Proposals -> detail (Phase 5). Ownership is enforced entirely
// server-side (GET /community-proposals/:id 404s identically for "not found"
// and "belongs to another community" -- never leaks existence). Resubmit form
// only renders when status is SENT_BACK, matching the approved workflow
// (APPROVED/REJECTED are terminal, no edit path).
//
// Phase 11 adds the two remaining lifecycle links, both from already-existing,
// already-authorized reads -- no new API, no new DB, no new audit surface:
//   - Decision: GET /approvals/:id (the generic engine's own read endpoint --
//     ungated by @Roles, authorized in ApprovalsService.assertCallerMayView by
//     "you are the requester", which every Community proposal's requestedBy
//     always is). SENT_BACK intentionally shows no reviewer comment: the engine
//     itself (see approval-request.repository.ts's markSentBack) never records
//     one on the approval_step for a send-back, only in Principal's audit trail
//     -- which stays ADMIN/PRINCIPAL-only (audit-log.controller.ts) and is not
//     opened up here, since Phase 11 must not change role permissions.
//   - Linked activity: GET /community-initiatives (Phase 6's own list endpoint,
//     already community-scoped), filtered client-side for proposalId === this
//     proposal's id -- the same "fetch the list, filter in the page" pattern
//     Phase 8's history view already uses, not a new lookup endpoint.

import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { ResubmitProposalForm } from "@/components/community/ResubmitProposalForm";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface ProposalDetail {
  id: string;
  communityName: string;
  title: string;
  description: string;
  status: string;
  approvalRequestId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApprovalStep {
  approverRoleCode: string;
  decision: string | null;
  comment: string | null;
  decidedAt: string | null;
}

interface ApprovalDetail {
  request: { state: string };
  steps: ApprovalStep[];
}

interface InitiativeSummary {
  id: string;
  proposalId: string;
  title: string;
  status: string;
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "critical";
  return "pending";
}

function roleLabel(code: string): string {
  return code.charAt(0) + code.slice(1).toLowerCase();
}

export default async function CommunityProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const res = await apiFetch(`/community-proposals/${id}`);
  if (res.status === 404) notFound();
  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this proposal</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: proposal } = (await res.json()) as { data: ProposalDetail };

  // Decision: same request the Principal decided on, read via the engine's own
  // endpoint -- not duplicated into community_proposal.
  let decidedStep: ApprovalStep | null = null;
  let approvalState: string | null = null;
  let decisionLoadFailed = false;
  if (proposal.approvalRequestId) {
    const approvalRes = await apiFetch(`/approvals/${proposal.approvalRequestId}`);
    if (approvalRes.ok) {
      const { data: approval } = (await approvalRes.json()) as { data: ApprovalDetail };
      approvalState = approval.request.state;
      decidedStep = approval.steps.find((s) => s.decision) ?? null;
    } else {
      decisionLoadFailed = true;
    }
  }

  // Linked activity: only an APPROVED proposal can ever have one (Phase 6's
  // CommunityInitiativesService.findApprovedOwnProposal enforces that at
  // creation) -- fetching otherwise would only ever find nothing.
  let linkedActivity: InitiativeSummary | null = null;
  let activityLoadFailed = false;
  if (proposal.status === "APPROVED") {
    const initiativesRes = await apiFetch("/community-initiatives");
    if (initiativesRes.ok) {
      const { data: initiatives } = (await initiativesRes.json()) as { data: InitiativeSummary[] };
      linkedActivity = initiatives.find((i) => i.proposalId === proposal.id) ?? null;
    } else {
      activityLoadFailed = true;
    }
  }

  return (
    <div className="mx-auto max-w-[720px]">
      <BackLink href="/community/proposals" label="Proposals" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">{proposal.title}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {proposal.communityName} · submitted {formatDate(proposal.createdAt)}
          </p>
        </div>
        <StatusPill tone={statusTone(proposal.status)} label={proposal.status.replace(/_/g, " ")} />
      </div>

      <div className="mt-6 rounded-[16px] border border-border bg-surface p-6">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Description</h2>
        <p className="mt-2 text-sm text-text">{proposal.description}</p>
      </div>

      {proposal.approvalRequestId && (
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-6">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Decision</h2>
          {decisionLoadFailed ? (
            <p className="mt-2 text-sm text-critical-text">Couldn&apos;t load the decision — try refreshing the page.</p>
          ) : approvalState === "PENDING" || approvalState === "RETROSPECTIVE_PENDING" ? (
            <p className="mt-2 text-sm text-text-muted">Awaiting Principal review.</p>
          ) : proposal.status === "SENT_BACK" ? (
            <p className="mt-2 text-sm text-text-muted">Sent back to you for revision. Resubmit below to continue.</p>
          ) : decidedStep ? (
            <div className="mt-2 text-sm text-text">
              <p>
                <span className="font-semibold">{roleLabel(decidedStep.approverRoleCode)}</span>{" "}
                {decidedStep.decision === "APPROVED" ? "approved" : "rejected"} this proposal
                {decidedStep.decidedAt ? ` on ${formatDate(decidedStep.decidedAt)}` : ""}.
              </p>
              {decidedStep.comment && <p className="mt-1.5 text-text-muted">&ldquo;{decidedStep.comment}&rdquo;</p>}
            </div>
          ) : (
            <p className="mt-2 text-sm text-text-muted">No decision recorded yet.</p>
          )}
        </div>
      )}

      {proposal.status === "APPROVED" && (
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-6">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Linked activity</h2>
          {activityLoadFailed ? (
            <p className="mt-2 text-sm text-critical-text">Couldn&apos;t load the linked activity — try refreshing the page.</p>
          ) : linkedActivity ? (
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-text">{linkedActivity.title}</span>
              <span className="flex shrink-0 items-center gap-2">
                <StatusPill
                  tone={linkedActivity.status === "COMPLETED" ? "success" : "pending"}
                  label={linkedActivity.status.replace(/_/g, " ")}
                />
                <Link href={`/community/activities/${linkedActivity.id}`} className="font-semibold text-primary">
                  View
                </Link>
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-text-muted">Not yet initialized into an activity.</p>
          )}
        </div>
      )}

      {proposal.status === "SENT_BACK" && (
        <div className="mt-6">
          <ResubmitProposalForm id={proposal.id} title={proposal.title} description={proposal.description} />
        </div>
      )}
    </div>
  );
}
