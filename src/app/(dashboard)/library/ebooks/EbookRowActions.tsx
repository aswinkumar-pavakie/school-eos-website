"use client";

import { useState, useTransition } from "react";
import { reactivateEbookAction, withdrawEbookAction } from "./actions";

export function EbookRowActions({ id, status, resourceUrl }: { id: string; status: "ACTIVE" | "WITHDRAWN"; resourceUrl: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  return (
    <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
      {error && <span style={{ font: "500 12px/1.3 var(--lib-font-sans)", color: "var(--lib-red)" }}>{error}</span>}
      <a
        href={resourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="lib-link-hover"
        style={{ color: "var(--lib-primary)", font: "600 13px/1.3 var(--lib-font-sans)" }}
      >
        Open
      </a>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(undefined);
            try {
              if (status === "ACTIVE") await withdrawEbookAction(id);
              else await reactivateEbookAction(id);
            } catch (err) {
              setError(err instanceof Error ? err.message : "That didn't work.");
            }
          })
        }
        style={{ border: 0, background: "transparent", color: status === "ACTIVE" ? "var(--lib-red)" : "var(--lib-primary)", font: "600 13px/1.3 var(--lib-font-sans)", cursor: "pointer", padding: 0 }}
      >
        {status === "ACTIVE" ? "Withdraw" : "Reactivate"}
      </button>
    </span>
  );
}
