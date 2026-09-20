"use client";

import { useState } from "react";
import { DangerLink } from "./primitives";
import { useFlash } from "./FlashContext";

// Shared Delete/Deactivate/Cancel/Withdraw action -- native window.confirm
// (no fabricated custom confirm modal needed for a single irreversible
// click), real server action call, pending + error state. Reused across
// every Sports Admin register screen instead of duplicating this per page.
export function DeleteButton({
  label = "Delete",
  confirmMessage,
  action,
  successMessage,
}: {
  label?: string;
  confirmMessage: string;
  action: () => Promise<{ error?: string } | void>;
  successMessage?: string;
}) {
  const [pending, setPending] = useState(false);
  const { showFlash } = useFlash();

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setPending(true);
    try {
      const result = await action();
      if (result && "error" in result && result.error) {
        showFlash(result.error);
      } else if (successMessage) {
        showFlash(successMessage);
      }
    } catch (err) {
      showFlash(err instanceof Error ? err.message : "That didn't work. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <DangerLink onClick={handleClick} disabled={pending}>
      {pending ? "Working…" : label}
    </DangerLink>
  );
}
