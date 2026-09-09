import Link from "next/link";
import { redirect } from "next/navigation";
import { ChildSwitcher } from "@/components/dashboard/ChildSwitcher";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { AuthExpiredError } from "@/lib/api";
import { formatBytes, formatDate, formatDateTime, orDash } from "@/lib/format";
import {
  getFolderFiles,
  getSubjectDetail,
  getSubjectFileUrl,
  listChildren,
  resolveSelectedChild,
} from "@/lib/parent-api";

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

    if (!selected) {
      return <EmptyState title="No children linked" body="This account has no linked students yet." />;
    }

    const detail = await getSubjectDetail(selected.studentId, subjectOfferingId);

    return (
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href={`/parent/term?studentId=${selected.studentId}`} className="text-xs font-semibold text-primary hover:underline">
              ← Current Term
            </Link>
            <h1 className="mt-1 text-2xl font-extrabold text-text">{detail.offering.subjectName}</h1>
            <p className="mt-1 text-sm text-text-muted">
              {orDash(detail.offering.teacherName)}
              {detail.offering.weeklyPeriods !== null ? ` · ${detail.offering.weeklyPeriods} periods/week` : ""}
            </p>
          </div>
          <ChildSwitcher students={children} selectedStudentId={selected.studentId} />
        </div>

        <div className="mt-8">
          <h2 className="text-[15px] font-extrabold text-text">Materials</h2>
          {detail.folders.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No materials yet" body="This subject has no shared folders yet." />
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {detail.folders.map((folder) => {
                const isOpen = folderId === folder.id;
                return (
                  <div key={folder.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text">{folder.title}</p>
                        {folder.description ? <p className="mt-1 text-xs text-text-muted">{folder.description}</p> : null}
                      </div>
                      <Link
                        href={
                          isOpen
                            ? `/parent/term/${subjectOfferingId}?studentId=${selected.studentId}`
                            : `/parent/term/${subjectOfferingId}?studentId=${selected.studentId}&folderId=${folder.id}`
                        }
                        className="shrink-0 text-xs font-semibold text-primary hover:underline"
                      >
                        {isOpen ? "Hide files" : `${folder.fileCount} file${folder.fileCount === 1 ? "" : "s"}`}
                      </Link>
                    </div>
                    {isOpen ? (
                      <FolderFiles studentId={selected.studentId} subjectOfferingId={subjectOfferingId} folderId={folder.id} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-[15px] font-extrabold text-text">Lesson plans</h2>
          {detail.lessonPlans.length === 0 ? (
            <div className="mt-3">
              <EmptyState title="No lesson plans yet" body="Lesson plans will appear here once posted." />
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {detail.lessonPlans.map((lp) => (
                <li key={lp.id} className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-text">{lp.title}</p>
                    {lp.weekStart ? <span className="text-xs text-text-muted">Week of {formatDate(lp.weekStart)}</span> : null}
                  </div>
                  {lp.content ? <p className="mt-2 whitespace-pre-wrap text-sm text-text">{lp.content}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this subject. Nothing was changed — try again." />;
  }
}

async function FolderFiles({
  studentId,
  subjectOfferingId,
  folderId,
}: {
  studentId: string;
  subjectOfferingId: string;
  folderId: string;
}) {
  const files = await getFolderFiles(studentId, subjectOfferingId, folderId);

  if (files.length === 0) {
    return <p className="mt-3 text-sm text-text-muted">No files in this folder yet.</p>;
  }

  const withUrls = await Promise.all(
    files.map(async (file) => ({ file, url: await getSubjectFileUrl(studentId, subjectOfferingId, file.id).catch(() => null) })),
  );

  return (
    <ul className="mt-3 flex flex-col divide-y divide-border rounded-[var(--radius-input)] border border-border bg-field">
      {withUrls.map(({ file, url }) => (
        <li key={file.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
          <div className="min-w-0">
            <p className="truncate font-semibold text-text">{file.fileName}</p>
            <p className="text-xs text-text-muted">
              {formatBytes(file.sizeBytes)} · {formatDateTime(file.uploadedAt)}
            </p>
          </div>
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-primary hover:underline">
              Open
            </a>
          ) : (
            <span className="shrink-0 text-xs text-text-muted">Unavailable</span>
          )}
        </li>
      ))}
    </ul>
  );
}
