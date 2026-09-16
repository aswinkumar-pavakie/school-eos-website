"use client";

import { useTransition } from "react";
import { useFlash } from "@/components/academic-coordinator-ui/FlashContext";
import { SecondaryButton } from "@/components/academic-coordinator-ui/primitives";
import { publishAllTimetablesAction } from "./actions";

export function PublishAllButton() {
  const [pending, startTransition] = useTransition();
  const { showFlash } = useFlash();

  return (
    <SecondaryButton
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await publishAllTimetablesAction();
          showFlash(
            result.publishedSections > 0
              ? `Published drafts for ${result.publishedSections} class${result.publishedSections === 1 ? "" : "es"}.`
              : "No draft periods to publish in your scope.",
          );
        })
      }
    >
      {pending ? "Publishing…" : "Publish all classes"}
    </SecondaryButton>
  );
}
