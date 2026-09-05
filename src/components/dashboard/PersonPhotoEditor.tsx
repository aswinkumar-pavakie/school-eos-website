"use client";

// Admin-editable profile photo -- shows the current photo (or initials), with a
// small overlay control to upload a replacement or remove it, and a full-size
// viewer on clicking the photo itself. Used on the Student, Faculty, and Parent
// profile headers alike (all three are just a `person` row). Left-aligned (not
// centered) so it sits flush with the name/details beside it, matching how the
// rest of the header is laid out.

import { useActionState, useRef, useState, useTransition } from "react";
import { PersonAvatar } from "@/components/dashboard/PersonAvatar";
import { removePersonPhotoAction, uploadPersonPhotoAction, type PhotoActionState } from "@/lib/photo-actions";
import { resolvePhotoUrl } from "@/lib/resolve-photo-url";

const initialState: PhotoActionState = {};

export function PersonPhotoEditor({
  personId,
  photoUrl,
  name,
  revalidatePaths = [],
  size = 96,
  shape = "circle",
}: {
  personId: string;
  photoUrl: string | null;
  name: string;
  revalidatePaths?: string[];
  size?: number;
  shape?: "circle" | "square";
}) {
  const [open, setOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [removePending, startRemoveTransition] = useTransition();

  const action = uploadPersonPhotoAction.bind(null, personId, revalidatePaths);
  const [state, formAction, isUploadPending] = useActionState(action, initialState);

  const fullPhotoSrc = resolvePhotoUrl(photoUrl);

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => photoUrl && setViewerOpen(true)}
          aria-label={photoUrl ? `View ${name}'s photo` : name}
          className={photoUrl ? "cursor-pointer" : "cursor-default"}
        >
          <PersonAvatar photoUrl={photoUrl} name={name} size={size} shape={shape} />
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-sm font-bold text-text-muted shadow-sm hover:bg-bg"
          aria-label="Edit photo"
        >
          ✎
        </button>
      </div>

      {open && (
        <div className="flex flex-col items-start gap-2 rounded-[11px] border border-border bg-field p-3">
          <form
            action={formAction}
            className="flex flex-col items-start gap-2"
            onChange={() => {
              fileInputRef.current?.form?.requestSubmit();
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              disabled={isUploadPending}
              className="w-56 text-[13px] text-text-muted file:mr-3 file:rounded-[8px] file:border-0 file:bg-primary file:px-3.5 file:py-2 file:text-[13px] file:font-semibold file:text-white"
            />
          </form>
          {isUploadPending && <p className="text-[13px] text-text-muted">Uploading…</p>}
          {state.error && <p className="max-w-56 text-[13px] text-critical-text">{state.error}</p>}
          {photoUrl && (
            <button
              type="button"
              disabled={removePending}
              onClick={() => startRemoveTransition(() => removePersonPhotoAction(personId, revalidatePaths))}
              className="text-[13px] font-semibold text-critical-text disabled:opacity-60"
            >
              {removePending ? "Removing…" : "Remove photo"}
            </button>
          )}
        </div>
      )}

      {viewerOpen && fullPhotoSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#101828]/70 p-6"
          onClick={() => setViewerOpen(false)}
        >
          <div className="relative max-h-[85vh] max-w-[85vw]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element -- full-size preview of a dynamic backend-hosted photo */}
            <img
              src={fullPhotoSrc}
              alt={name}
              className="max-h-[85vh] max-w-[85vw] rounded-[16px] border border-border object-contain shadow-lg"
            />
            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              aria-label="Close"
              className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface text-lg font-bold text-text shadow-lg hover:bg-bg"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
