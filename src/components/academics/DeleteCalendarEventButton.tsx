"use client";

import { useTransition } from "react";
import { deleteCalendarEventAction } from "@/app/(dashboard)/admin/academic-calendar/actions";

export function DeleteCalendarEventButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => deleteCalendarEventAction(id))}
      className="text-xs font-semibold text-critical-text disabled:opacity-60"
    >
      {isPending ? "…" : "Remove"}
    </button>
  );
}
