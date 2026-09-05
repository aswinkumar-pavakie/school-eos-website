"use client";

import { useTransition } from "react";
import { archiveAnnouncementAction } from "@/app/(dashboard)/admin/announcements/actions";

export function ArchiveAnnouncementButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => archiveAnnouncementAction(id))}
      className="text-xs font-semibold text-critical-text disabled:opacity-60"
    >
      {isPending ? "…" : "Archive"}
    </button>
  );
}
