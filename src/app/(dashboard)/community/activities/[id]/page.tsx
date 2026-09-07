// Community -> Activities -> detail (Phase 6 + 7 + 9). Ownership enforced
// entirely server-side, same 404-for-both pattern as Phase 5's proposal
// detail page. Start/complete are strictly forward, sequential transitions
// (PLANNED -> IN_PROGRESS -> COMPLETED) -- no skipping, no going back, no
// reopening. Phase 7 added progress notes (IN_PROGRESS only) and an outcome
// captured at completion. Phase 9 adds the one remaining "manage its own
// activity" gap: editing title/description/planned date, PLANNED only --
// community_id/proposal_id/created_by/status stay immutable for the
// activity's whole life (never fields on the edit form or its DTO).

import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/dashboard/BackLink";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { CompleteInitiativeForm } from "@/components/community/CompleteInitiativeForm";
import { EditInitiativeForm } from "@/components/community/EditInitiativeForm";
import { InitiativeLifecycleButton } from "@/components/community/InitiativeLifecycleButton";
import { UpdateProgressForm } from "@/components/community/UpdateProgressForm";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface InitiativeDetail {
  id: string;
  communityName: string;
  proposalId: string;
  title: string;
  description: string;
  status: string;
  plannedDate: string | null;
  venue: string | null;
  startedAt: string | null;
  completedAt: string | null;
  progressNotes: string | null;
  outcome: string | null;
  createdAt: string;
}

function statusTone(status: string): "success" | "pending" | "critical" {
  if (status === "COMPLETED") return "success";
  return "pending";
}

export default async function CommunityActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const res = await apiFetch(`/community-initiatives/${id}`);
  if (res.status === 404) notFound();
  if (!res.ok) {
    return (
      <div className="rounded-[16px] border border-border bg-surface p-8 text-center">
        <p className="text-[15px] font-extrabold leading-[20px] text-text">Couldn&apos;t load this activity</p>
        <p className="mt-1.5 text-sm text-text-muted">Nothing was changed — try refreshing the page.</p>
      </div>
    );
  }

  const { data: initiative } = (await res.json()) as { data: InitiativeDetail };

  return (
    <div className="mx-auto max-w-[720px]">
      <BackLink href="/community/activities" label="Activities" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-[34px] text-text">{initiative.title}</h1>
          <p className="mt-1 text-sm text-text-muted">
            {initiative.communityName}
            {initiative.plannedDate ? ` · planned ${formatDate(initiative.plannedDate)}` : ""}
            {initiative.venue ? ` · ${initiative.venue}` : ""}
            {" · "}
            <Link href={`/community/proposals/${initiative.proposalId}`} className="font-semibold text-primary">
              View originating proposal
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone={statusTone(initiative.status)} label={initiative.status.replace(/_/g, " ")} />
          {initiative.status === "PLANNED" && <InitiativeLifecycleButton id={initiative.id} />}
        </div>
      </div>

      <div className="mt-6 rounded-[16px] border border-border bg-surface p-6">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Description</h2>
        <p className="mt-2 text-sm text-text">{initiative.description}</p>
      </div>

      {initiative.status === "PLANNED" && (
        <div className="mt-6">
          <EditInitiativeForm
            id={initiative.id}
            title={initiative.title}
            description={initiative.description}
            plannedDate={initiative.plannedDate}
            venue={initiative.venue}
          />
        </div>
      )}

      <div className="mt-6 rounded-[16px] border border-border bg-surface p-6">
        <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Timeline</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Started</dt>
            <dd className="mt-0.5 text-text">{initiative.startedAt ? formatDate(initiative.startedAt) : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.09em] text-text-muted">Completed</dt>
            <dd className="mt-0.5 text-text">{initiative.completedAt ? formatDate(initiative.completedAt) : "—"}</dd>
          </div>
        </dl>
      </div>

      {initiative.status === "IN_PROGRESS" && (
        <div className="mt-6 flex flex-col gap-6">
          <UpdateProgressForm id={initiative.id} progressNotes={initiative.progressNotes} />
          <CompleteInitiativeForm id={initiative.id} />
        </div>
      )}

      {initiative.status === "COMPLETED" && initiative.progressNotes && (
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-6">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Progress</h2>
          <p className="mt-2 text-sm text-text">{initiative.progressNotes}</p>
        </div>
      )}

      {initiative.status === "COMPLETED" && initiative.outcome && (
        <div className="mt-6 rounded-[16px] border border-border bg-surface p-6">
          <h2 className="text-[15px] font-extrabold leading-[20px] text-text">Outcome</h2>
          <p className="mt-2 text-sm text-text">{initiative.outcome}</p>
        </div>
      )}
    </div>
  );
}
