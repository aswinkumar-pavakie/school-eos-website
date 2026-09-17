// Documents -- pixel-rebuilt from the design's own isDocuments screen
// (Request-a-certificate expandable panel + issued-documents list). Real
// document_request data (listDocumentRequests/createDocumentRequest), same
// /parent/students/:id/documents endpoints the design/backend already
// establish. Approved documents resolve a real, short-lived download URL
// server-side.

import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel, StatusPill, type PillTone } from "@/components/parent-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { getDocumentDownloadUrl, listChildren, listDocumentRequests, resolveSelectedChild, type DocumentRequest } from "@/lib/parent-api";
import { docTypeLabel } from "./labels";
import { RequestCertificatePanel } from "./RequestCertificatePanel";

const STATE_TONE: Record<DocumentRequest["state"], PillTone> = {
  PENDING: "amber",
  APPROVED: "blue",
  REJECTED: "red",
};

export default async function ParentDocumentsPage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  try {
    const { studentId: requestedStudentId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const requests = await listDocumentRequests(selected.studentId);
    const downloadLinks = await resolveDownloadLinks(selected.studentId, requests);

    return (
      <div className="parent-scope">
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6, color: "var(--par-ink)" }}>Documents</div>
          <div style={{ fontSize: 15, color: "var(--par-body-muted)" }}>
            Certificates and requests for {selected.studentName} · {[selected.gradeName, selected.sectionName].filter(Boolean).join("-")}
          </div>
        </div>

        <RequestCertificatePanel studentId={selected.studentId} />

        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: "var(--par-ink)" }}>Your requests</div>

        {requests.length === 0 ? (
          <EmptyPanel label="No document requests yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {requests.map((r) => (
              <DocumentCard key={r.id} request={r} downloadUrl={downloadLinks[r.id]} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load document requests."} />;
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
    <div style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card-sm)", padding: "18px 22px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: 9, background: "var(--par-tint)", color: "var(--par-primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 17, height: 17 }}>
              <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h4" />
            </svg>
          </span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--par-ink)" }}>{docTypeLabel(request.docType)}</div>
            <div style={{ fontSize: 12, color: "var(--par-tertiary-2)" }}>Requested {formatDate(request.createdAt)}</div>
          </div>
        </div>
        <StatusPill label={request.state} tone={STATE_TONE[request.state]} />
      </div>
      <div style={{ fontSize: 14, color: "var(--par-body)", marginBottom: request.decisionNote || request.state === "APPROVED" ? 10 : 0 }}>{request.reason}</div>
      {request.decisionNote && (
        <div style={{ fontSize: 13, color: "var(--par-body-muted)", marginBottom: 6 }}>
          Note: {request.decisionNote}
          {request.decidedAt ? ` · ${formatDate(request.decidedAt)}` : ""}
        </div>
      )}
      {request.state === "APPROVED" && (
        downloadUrl ? (
          <a href={downloadUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, color: "var(--par-primary)" }}>
            Download{request.documentFileName ? ` · ${request.documentFileName}` : ""}
          </a>
        ) : (
          <div style={{ fontSize: 12.5, color: "var(--par-tertiary-2)" }}>Approved — document not attached yet.</div>
        )
      )}
    </div>
  );
}
