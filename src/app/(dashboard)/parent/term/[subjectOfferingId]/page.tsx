// Current term -- subject detail. Pixel-rebuilt companion to
// /parent/term. Real folder/file/lesson-plan data
// (getSubjectDetail/getFolderFiles/getSubjectFileUrl).

import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { EmptyPanel } from "@/components/parent-ui/primitives";
import { AuthExpiredError } from "@/lib/api";
import { formatBytes, formatDate, formatDateTime, orDash } from "@/lib/format";
import { getFolderFiles, getSubjectDetail, getSubjectFileUrl, listChildren, resolveSelectedChild } from "@/lib/parent-api";

export default async function ParentSubjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ subjectOfferingId: string }>;
  searchParams: Promise<{ studentId?: string; folderId?: string }>;
}) {
  try {
    const { subjectOfferingId } = await params;
    const { studentId: requestedStudentId, folderId } = await searchParams;
    const children = await listChildren();
    const selected = resolveSelectedChild(children, requestedStudentId);
    if (!selected) return <ErrorState message="No children linked to this account." />;

    const detail = await getSubjectDetail(selected.studentId, subjectOfferingId);

    return (
      <div className="parent-scope">
        <Link href={`/parent/term?studentId=${selected.studentId}`} style={{ fontSize: 13, fontWeight: 700, color: "var(--par-primary)" }}>
          ‹ Current term
        </Link>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.01em", marginTop: 10, marginBottom: 4, color: "var(--par-ink)" }}>{detail.offering.subjectName}</div>
        <div style={{ fontSize: 14, color: "var(--par-body-muted)", marginBottom: 24 }}>
          {orDash(detail.offering.teacherName)}
          {detail.offering.weeklyPeriods !== null ? ` · ${detail.offering.weeklyPeriods} periods/week` : ""}
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--par-ink)", marginBottom: 12 }}>Materials</div>
        {detail.folders.length === 0 ? (
          <EmptyPanel label="This subject has no shared folders yet." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            {detail.folders.map((folder) => {
              const isOpen = folderId === folder.id;
              return (
                <div key={folder.id} style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card-sm)", padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--par-ink)" }}>{folder.title}</div>
                      {folder.description && <div style={{ fontSize: 12.5, color: "var(--par-body-muted)", marginTop: 2 }}>{folder.description}</div>}
                    </div>
                    <Link
                      href={isOpen ? `/parent/term/${subjectOfferingId}?studentId=${selected.studentId}` : `/parent/term/${subjectOfferingId}?studentId=${selected.studentId}&folderId=${folder.id}`}
                      style={{ fontSize: 12.5, fontWeight: 700, color: "var(--par-primary)", flexShrink: 0 }}
                    >
                      {isOpen ? "Hide files" : `${folder.fileCount} file${folder.fileCount === 1 ? "" : "s"}`}
                    </Link>
                  </div>
                  {isOpen && <FolderFiles studentId={selected.studentId} subjectOfferingId={subjectOfferingId} folderId={folder.id} />}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--par-ink)", marginBottom: 12 }}>Lesson plans</div>
        {detail.lessonPlans.length === 0 ? (
          <EmptyPanel label="Lesson plans will appear here once posted." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {detail.lessonPlans.map((lp) => (
              <div key={lp.id} style={{ background: "#fff", border: "1px solid var(--par-border)", borderRadius: "var(--par-radius-card-sm)", padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--par-ink)" }}>{lp.title}</div>
                  {lp.weekStart && <div style={{ fontSize: 12, color: "var(--par-tertiary-2)" }}>Week of {formatDate(lp.weekStart)}</div>}
                </div>
                {lp.content && <div style={{ fontSize: 14, color: "var(--par-body)", marginTop: 8, whiteSpace: "pre-wrap" }}>{lp.content}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message={err instanceof Error ? err.message : "Couldn't load this subject."} />;
  }
}

async function FolderFiles({ studentId, subjectOfferingId, folderId }: { studentId: string; subjectOfferingId: string; folderId: string }) {
  const files = await getFolderFiles(studentId, subjectOfferingId, folderId);
  if (files.length === 0) {
    return <div style={{ fontSize: 13.5, color: "var(--par-tertiary)", marginTop: 12 }}>No files in this folder yet.</div>;
  }
  const withUrls = await Promise.all(files.map(async (file) => ({ file, url: await getSubjectFileUrl(studentId, subjectOfferingId, file.id).catch(() => null) })));

  return (
    <div style={{ marginTop: 12, border: "1px solid var(--par-border)", borderRadius: 10, overflow: "hidden" }}>
      {withUrls.map(({ file, url }) => (
        <div key={file.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", borderBottom: "1px solid var(--par-divider)", background: "var(--par-panel-2)" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--par-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.fileName}</div>
            <div style={{ fontSize: 12, color: "var(--par-tertiary-2)" }}>{formatBytes(file.sizeBytes)} · {formatDateTime(file.uploadedAt)}</div>
          </div>
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--par-primary)", flexShrink: 0 }}>Open</a>
          ) : (
            <span style={{ fontSize: 12.5, color: "var(--par-tertiary)", flexShrink: 0 }}>Unavailable</span>
          )}
        </div>
      ))}
    </div>
  );
}
