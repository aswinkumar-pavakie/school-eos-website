import Link from "next/link";
import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/EmptyState";
import { PlainButton } from "@/components/ui/Button";
import { AuthExpiredError } from "@/lib/api";
import { formatDateTime, formatBytes } from "@/lib/format";
import { getLmsFolder, listLmsSubjects } from "@/lib/faculty-lms-api";
import { FolderModal } from "../../_shared/FolderModal";
import { UploadForm } from "./UploadForm";
import { OpenFileButton } from "./OpenFileButton";
import { deleteFileAction, deleteFolderAction } from "../../actions";

export default async function LmsFolderDetailPage({ params }: { params: Promise<{ folderId: string }> }) {
  try {
    const { folderId } = await params;
    const folder = await getLmsFolder(folderId);
    const subjects = await listLmsSubjects();
    const subject = subjects.find((s) => s.subjectId === folder.subjectId);
    const classes = subject?.classes ?? [];

    return (
      <div className="flex flex-col gap-6">
        <div>
          <Link href={`/faculty/lms/${folder.subjectId}?tab=materials`} className="text-xs font-semibold text-text-muted hover:text-text">← Back to {subject?.subjectName ?? "subject"}</Link>
          <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-extrabold text-text">{folder.title}</h1>
            <div className="flex gap-2">
              <FolderModal subjectId={folder.subjectId} classes={classes} folder={folder} />
              <form action={deleteFolderAction.bind(null, folder.id, folder.subjectId)}>
                <PlainButton type="submit" variant="danger">Delete folder</PlainButton>
              </form>
            </div>
          </div>
          {folder.description ? <p className="mt-1 text-sm text-text-muted">{folder.description}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {classes.map((c) => {
            const shared = folder.shareOfferingIds.includes(c.subjectOfferingId);
            return (
              <span key={c.subjectOfferingId} className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-bold ${shared ? "bg-success-bg text-success-text" : "bg-field text-text-muted"}`}>
                {c.gradeName} {c.sectionName}
              </span>
            );
          })}
        </div>

        <UploadForm folderId={folder.id} />

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-extrabold text-text">Files</h2>
          {folder.files.length === 0 ? (
            <p className="text-sm text-text-muted">No files uploaded yet.</p>
          ) : (
            folder.files.map((f) => (
              <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">{f.fileName}</p>
                  <p className="text-xs text-text-muted">{formatBytes(f.sizeBytes)} · {formatDateTime(f.uploadedAt)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <OpenFileButton fileId={f.id} fileName={f.fileName} />
                  <form action={deleteFileAction.bind(null, f.id, folder.id)}>
                    <PlainButton type="submit" variant="danger">Delete</PlainButton>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof AuthExpiredError) redirect("/login");
    return <ErrorState message="Couldn't load this folder. Nothing was changed — try again." />;
  }
}
