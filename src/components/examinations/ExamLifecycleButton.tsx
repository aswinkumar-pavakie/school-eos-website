"use client";

import { useState, useTransition } from "react";
import { lockExamAction, publishExamAction } from "@/app/(dashboard)/admin/examinations/actions";

export function ExamLifecycleButton({ id, action }: { id: string; action: "publish" | "lock" }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = action === "publish" ? publishExamAction : lockExamAction;
  const label = action === "publish" ? "Publish" : "Lock";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await run(id);
            if (result?.error) setError(result.error);
          })
        }
        className={`rounded-[11px] px-3.5 py-2 text-sm font-bold text-white disabled:opacity-60 ${
          action === "publish" ? "bg-primary" : "bg-text"
        }`}
      >
        {isPending ? "…" : label}
      </button>
      {error && <p className="max-w-[220px] text-right text-xs text-critical-text">{error}</p>}
    </div>
  );
}
