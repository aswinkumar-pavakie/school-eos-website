"use client";

import { useState } from "react";
import { markIssueLostAction, renewIssueAction, returnIssueAction } from "./actions";
import type { LibraryIssue } from "@/lib/library-api";

function ActionButton({ label, pendingLabel, onRun, tone = "default" }: { label: string; pendingLabel: string; onRun: () => Promise<void>; tone?: "default" | "critical" }) {
  const [isPending, setIsPending] = useState(false);
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        setIsPending(true);
        onRun().finally(() => setIsPending(false));
      }}
      className={`rounded-[9px] border border-border px-2.5 py-1 text-xs font-semibold hover:bg-field disabled:opacity-60 ${
        tone === "critical" ? "text-critical-text" : "text-text"
      }`}
    >
      {isPending ? pendingLabel : label}
    </button>
  );
}

export function IssueRowActions({ issue }: { issue: LibraryIssue }) {
  if (issue.status === "RETURNED" || issue.status === "LOST") {
    return <span className="text-xs text-text-muted">—</span>;
  }
  return (
    <div className="flex justify-end gap-2">
      <ActionButton label="Return" pendingLabel="Returning…" onRun={() => returnIssueAction(issue.id)} />
      <ActionButton label="Renew" pendingLabel="Renewing…" onRun={() => renewIssueAction(issue.id)} />
      <ActionButton label="Mark lost" pendingLabel="Saving…" tone="critical" onRun={() => markIssueLostAction(issue.id)} />
    </div>
  );
}
