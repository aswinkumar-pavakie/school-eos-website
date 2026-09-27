// Parent's own "Permissions" feature -- every real event permission request
// across every ACTIVE guardian link this parent holds (see
// ParentPermissionsService.list -> StudentEventParticipantRepository
// .findForGuardian), same real backend the mobile app's own Permissions
// screens already use (app/(protected)/permissions/*). This was previously a
// dead feature on the website: the backend + the parent-api.ts client were
// both fully built, but no page ever called them -- Faculty could create an
// event and add a student (a real PENDING row), yet the parent had no way to
// see or act on it. This page closes that gap, following the same
// list+inline-detail convention Faculty's own /faculty/permissions page uses
// (a `?requestId=` search param selects which request's detail shows).

import Link from "next/link";
import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { AuthExpiredError } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/format";
import { getPermissionRequest, listChildren, listPermissionRequests, resolveSelectedChild, type PermissionParticipant, type PermissionState } from "@/lib/parent-api";
import { PermissionDecisionForm } from "./PermissionDecisionForm";

const STATE_LABEL: Record<PermissionState, string> = {
  PENDING: "Waiting for your decision",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
const STATE_CLASSES: Record<PermissionState, string> = {
  PENDING: "bg-field text-text",
  APPROVED: "bg-[var(--par-tint)] text-[var(--par-primary)]",
  REJECTED: "bg-[var(--par-red-bg)] text-[var(--par-red)]",
};

function StatePill({ state }: { state: PermissionState }) {
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${STATE_CLASSES[state]}`}>{STATE_LABEL[state]}</span>;
}

export default async function ParentPermissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string; requestId?: string }>;
}) {
  try {
    const { studentId: requestedStudentId, requestId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const all = await listPermissionRequests();
    const requests: PermissionParticipant[] = all.filter((r) => r.studentId === selected.studentId);
    const selectedId = (requestId && requests.some((r) => r.id === requestId) ? requestId : requests[0]?.id) ?? null;
    const detail = selectedId ? await getPermissionRequest(selectedId).catch(() => null) : null;

    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-text">Permissions</h1>
            <p className="text-sm text-text-muted">Event participation requests for {selected.studentName}</p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        {requests.length === 0 ? (
          <EmptyState title="No permission requests yet" body={`${selected.studentName} has no event permission requests right now.`} />
        ) : (
          <div className="grid gap-4 md:grid-cols-[320px_1fr]">
            <div className="flex flex-col gap-2">
              {requests.map((r) => (
                <Link
                  key={r.id}
                  href={`/parent/permissions?studentId=${selected.studentId}&requestId=${r.id}`}
                  className={`rounded-[var(--radius-card)] border p-4 no-underline transition-colors ${r.id === selectedId ? "border-primary bg-surface" : "border-border bg-surface hover:border-primary/50"}`}
                >
                  <p className="text-sm font-bold text-text">{r.eventName}</p>
                  <p className="mt-1 text-xs text-text-muted">Requested {formatDate(r.addedAt)}</p>
                  <div className="mt-2">
                    <StatePill state={r.state} />
                  </div>
                </Link>
              ))}
            </div>

            <div>
              {!detail ? (
                <EmptyState title="Select a request" body="Choose a permission request on the left to see its details." />
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
                    <h2 className="text-base font-bold text-text">{detail.event.name}</h2>
                    <dl className="mt-4 grid gap-3 text-sm">
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Location</dt>
                        <dd className="mt-0.5 text-text">{detail.event.location}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">When</dt>
                        <dd className="mt-0.5 text-text">{formatDateTime(detail.event.startsAt)} – {formatDateTime(detail.event.endsAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Purpose</dt>
                        <dd className="mt-0.5 text-text">{detail.event.purpose}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold uppercase tracking-wide text-text-muted">Supervised by</dt>
                        <dd className="mt-0.5 text-text">
                          {detail.event.monitoringTeacherName}
                          {detail.event.monitoringTeacherDesignation ? ` · ${detail.event.monitoringTeacherDesignation}` : ""}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {detail.participant.state === "PENDING" ? (
                    <PermissionDecisionForm requestId={detail.participant.id} studentId={selected.studentId} />
                  ) : detail.participant.state === "APPROVED" ? (
                    <Link href={`/parent/permissions/letter/${detail.participant.id}?studentId=${selected.studentId}`}>
                      <PlainButton variant="primary" className="w-full">View / print permission letter</PlainButton>
                    </Link>
                  ) : (
                    <div className="rounded-[var(--radius-card)] bg-[var(--par-red-bg)] p-4 text-center text-sm font-semibold text-[var(--par-red)]">
                      You rejected this request{detail.participant.decidedAt ? ` on ${formatDate(detail.participant.decidedAt)}` : ""}.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load permission requests. Nothing was changed -- try again." />;
  }
}
