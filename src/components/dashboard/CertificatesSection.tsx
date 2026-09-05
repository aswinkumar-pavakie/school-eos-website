"use client";

// Certificates -- real document rows (ownerDomain 'PEOPLE'), not a separate
// table. Works for any admission-time or later-received certificate: Transfer
// Certificate, Birth Certificate, Aadhar, community/income certificate, etc. --
// docType is free text, not a fixed list, since schools deal with many kinds.

import { useActionState, useState } from "react";
import { purgeDocumentAction, uploadDocumentAction, type DocumentActionState } from "@/lib/document-actions";
import { formatDate } from "@/lib/format";

export interface CertificateDocument {
  id: string;
  docType: string;
  fileName: string;
  fileUrl: string | null;
  uploadedAt: string;
  status: string;
}

const initialState: DocumentActionState = {};

export function CertificatesSection({
  ownerObjectType,
  ownerObjectId,
  category,
  documents,
  revalidatePaths,
}: {
  ownerObjectType: string;
  ownerObjectId: string;
  category: string;
  documents: CertificateDocument[];
  revalidatePaths: string[];
}) {
  const [open, setOpen] = useState(false);
  const action = uploadDocumentAction.bind(null, ownerObjectType, ownerObjectId, category, revalidatePaths);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const active = documents.filter((d) => d.status !== "PURGED");

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">{active.length} certificates on file</p>
        <button type="button" onClick={() => setOpen((v) => !v)} className="text-[13px] font-semibold text-primary">
          {open ? "Cancel" : "+ Add certificate"}
        </button>
      </div>

      {open && (
        <form
          action={(formData) => {
            formAction(formData);
            setOpen(false);
          }}
          className="mt-3 flex flex-col gap-3 rounded-[11px] bg-field p-3.5"
        >
          {state.error && (
            <p className="rounded-[11px] bg-critical-bg px-3 py-2 text-sm text-critical-text">{state.error}</p>
          )}
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">Certificate type *</span>
            <input
              name="docType"
              required
              disabled={isPending}
              placeholder="e.g. Transfer Certificate, Birth Certificate, Aadhar"
              className="rounded-[11px] border border-border bg-surface px-3 py-2 text-text outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-semibold text-text">File *</span>
            <input
              type="file"
              name="file"
              required
              disabled={isPending}
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="text-sm text-text-muted file:mr-2 file:rounded-[7px] file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="self-start rounded-[11px] bg-primary px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {isPending ? "Uploading…" : "Upload"}
          </button>
        </form>
      )}

      <ul className="mt-3 flex flex-col gap-2">
        {active.length === 0 && !open && (
          <li className="py-4 text-center text-sm text-text-muted">No certificates uploaded yet.</li>
        )}
        {active.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between gap-3 rounded-[11px] border border-border bg-surface px-3.5 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                <FileIcon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                {d.fileUrl ? (
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-[13.5px] font-semibold text-text hover:text-primary hover:underline"
                  >
                    {d.docType}
                  </a>
                ) : (
                  <p className="truncate text-[13.5px] font-semibold text-text">{d.docType}</p>
                )}
                <p className="truncate text-xs text-text-muted">
                  {d.fileName} · uploaded {formatDate(d.uploadedAt)}
                  {!d.fileUrl && " · file unavailable"}
                </p>
              </div>
            </div>
            <RemoveButton id={d.id} revalidatePaths={revalidatePaths} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M7 3.5h7l4.5 4.5V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h4.5" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4.5 6.5h15" />
      <path d="M8.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 5v1.5" />
      <path d="M6.5 6.5 7.3 19a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12.5" />
      <path d="M10 10.5v6M14 10.5v6" />
    </svg>
  );
}

function RemoveButton({ id, revalidatePaths }: { id: string; revalidatePaths: string[] }) {
  const [isPending, setIsPending] = useState(false);
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={async () => {
        setIsPending(true);
        await purgeDocumentAction(id, revalidatePaths);
      }}
      aria-label="Remove certificate"
      title="Remove certificate"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-text-muted transition-colors hover:bg-critical-bg hover:text-critical-text disabled:opacity-60"
    >
      {isPending ? <span className="text-xs">…</span> : <TrashIcon className="h-4 w-4" />}
    </button>
  );
}
