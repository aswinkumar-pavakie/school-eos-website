"use client";

// Return / Renew / Damaged / Lost -- each opens the design's own ask()
// confirm dialog before running (the design's own close() helper wraps
// every one of these four in a confirm, not an instant fire).

import { useRouter } from "next/navigation";
import { ConfirmAction } from "@/components/library-ui/ConfirmModal";
import { useLibraryToast } from "@/components/library-ui/toast/ToastProvider";
import { markIssueDamagedAction, markIssueLostAction, renewIssueAction, returnIssueAction } from "../circulation/actions";
import type { LibraryIssue } from "@/lib/library-api";

export function ReturnRowActions({ issue }: { issue: LibraryIssue }) {
  const router = useRouter();
  const toast = useLibraryToast();

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
      <ConfirmAction
        title="Return book"
        body={`Return "${issue.bookTitle}" for ${issue.memberName}?`}
        cta="Return"
        onConfirm={async () => {
          await returnIssueAction(issue.id);
          toast.show(`${issue.bookTitle} — return recorded`);
          router.refresh();
        }}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            className="lib-btn-primary"
            style={{ padding: "10px 20px", border: 0, borderRadius: 9, background: "var(--lib-navy)", color: "#fff", font: "600 14px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
          >
            Return
          </button>
        )}
      />
      <ConfirmAction
        title="Renew book"
        body={`Renew "${issue.bookTitle}" for ${issue.memberName}?`}
        cta="Renew"
        onConfirm={async () => {
          await renewIssueAction(issue.id);
          toast.show("Renewed");
          router.refresh();
        }}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            className="lib-surface-hover"
            style={{ padding: "10px 20px", border: "1px solid var(--lib-border)", borderRadius: 9, background: "var(--lib-white)", color: "var(--lib-ink)", font: "500 14px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
          >
            Renew
          </button>
        )}
      />
      <ConfirmAction
        title="Mark as damaged"
        body={`Mark "${issue.bookTitle}" as damaged for ${issue.memberName}?`}
        cta="Mark damaged"
        danger
        onConfirm={async () => {
          await markIssueDamagedAction(issue.copyId);
          toast.show(`${issue.bookTitle} — marked damaged`);
          router.refresh();
        }}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            className="lib-danger-icon-hover"
            style={{ padding: "10px 20px", border: "1px solid var(--lib-red-border)", borderRadius: 9, background: "var(--lib-white)", color: "var(--lib-red)", font: "500 14px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
          >
            Damaged
          </button>
        )}
      />
      <ConfirmAction
        title="Mark as lost"
        body={`Mark "${issue.bookTitle}" as lost for ${issue.memberName}?`}
        cta="Mark lost"
        danger
        onConfirm={async () => {
          await markIssueLostAction(issue.id);
          toast.show(`${issue.bookTitle} — marked lost`);
          router.refresh();
        }}
        trigger={(open) => (
          <button
            type="button"
            onClick={open}
            className="lib-danger-icon-hover"
            style={{ padding: "10px 20px", border: "1px solid var(--lib-red-border)", borderRadius: 9, background: "var(--lib-white)", color: "var(--lib-red)", font: "500 14px/1.2 var(--lib-font-sans)", cursor: "pointer" }}
          >
            Lost
          </button>
        )}
      />
    </div>
  );
}
