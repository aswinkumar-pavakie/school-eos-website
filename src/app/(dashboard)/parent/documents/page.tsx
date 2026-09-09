// Parent Documents (Certificates) -- request a certificate/document for the
// selected child and track its real state; once APPROVED with a document
// attached, resolve a real, short-lived download URL server-side, same
// /parent/students/:id/documents endpoints the Parent mobile app's own
// Documents screen already calls.

import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import {
  getDocumentDownloadUrl,
  listChildren,
  listDocumentRequests,
  resolveSelectedChild,
  type DocumentRequest,
} from "@/lib/parent-api";
import { docTypeLabel } from "./labels";
import { NewDocumentRequestModal } from "./NewDocumentRequestModal";

export default async function ParentDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const requests = await listDocumentRequests(selected.studentId);
    const downloadLinks = await resolveDownloadLinks(selected.studentId, requests);

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text">Documents</h1>
            <p className="mt-1 text-sm text-text-muted">Request certificates for {selected.studentName} and track their status.</p>
          </div>
          <div className="flex items-center gap-3">
            <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
            <NewDocumentRequestModal studentId={selected.studentId} />
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="No document requests yet" body="Requests you submit for this child will appear here." />
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {requests.map((r) => (
              <DocumentCard key={r.id} request={r} downloadUrl={downloadLinks[r.id]} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load document requests. Nothing was changed — try again." />;
  }
}

async function resolveDownloadLinks(studentId: string, requests: DocumentRequest[]): Promise<Record<string, string>> {
  const approved = requests.filter((r) => r.state === "APPROVED" && r.documentObjectKey);
  if (approved.length === 0) return {};
  const entries = await Promise.all(
    approved.map(async (r) => [r.id, await getDocumentDownloadUrl(studentId, r.id).catch(() => "")] as const),
  );
  return Object.fromEntries(entries.filter(([, url]) => url));
}

function DocumentCard({ request, downloadUrl }: { request: DocumentRequest; downloadUrl?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-text">{docTypeLabel(request.docType)}</p>
          <p className="mt-1 text-xs text-text-muted">Requested {formatDate(request.createdAt)}</p>
        </div>
        <StatusPill state={request.state} />
      </div>
      <p className="mt-2 text-sm text-text">{request.reason}</p>
      {request.decisionNote ? <p className="mt-2 text-sm text-text-muted">Note: {request.decisionNote}</p> : null}
      {request.decidedAt ? <p className="mt-1 text-xs text-text-muted">Decided on {formatDate(request.decidedAt)}</p> : null}
      {request.state === "APPROVED" ? (
        downloadUrl ? (
          <a href={downloadUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
            Download{request.documentFileName ? ` · ${request.documentFileName}` : ""}
          </a>
        ) : (
          <p className="mt-3 text-xs text-text-muted">Approved — document not attached yet.</p>
        )
      ) : null}
    </div>
  );
}
